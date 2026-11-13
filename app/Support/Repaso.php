<?php

namespace App\Support;

use App\Models\PortuguesTarjeta;
use Carbon\CarbonImmutable;

/**
 * Repaso espaciado de las flashcards de portugués, versión simple del de
 * Anki (SM-2). Cada calificación decide en cuántos días vuelve la tarjeta:
 *
 *  - Otra vez: se olvidó. Vuelve a empezar (hoy mismo) y baja la facilidad.
 *  - Difícil: el intervalo crece poco (×1,2, mínimo 1 día) y baja la facilidad.
 *  - Bien: 1 día, después 3, después intervalo × facilidad.
 *  - Fácil: 4 días la primera vez; después crece más que con Bien y sube la facilidad.
 *
 * "Otra vez" y "Difícil" además la hacen reaparecer en la misma sesión (eso
 * lo maneja el navegador). Una palabra está aprendida cuando su intervalo
 * llega a APRENDIDA días: ya no sale en el repaso por unas 3 semanas.
 */
class Repaso
{
    public const OTRA_VEZ = 'otra_vez';

    public const DIFICIL = 'dificil';

    public const BIEN = 'bien';

    public const FACIL = 'facil';

    public const NOTAS = [self::OTRA_VEZ, self::DIFICIL, self::BIEN, self::FACIL];

    /** Días de intervalo desde los que una palabra cuenta como aprendida. */
    public const APRENDIDA = 21;

    /** Ninguna tarjeta espera más de un año. */
    public const MAX_INTERVALO = 365;

    public const FACILIDAD_MIN = 1.3;

    public const FACILIDAD_MAX = 3.0;

    public static function calificar(PortuguesTarjeta $t, string $nota, CarbonImmutable $hoy): void
    {
        $intervalo = $t->intervalo;
        $facilidad = $t->facilidad;
        $repeticiones = $t->repeticiones;

        switch ($nota) {
            case self::OTRA_VEZ:
                $intervalo = 0;
                $repeticiones = 0;
                $facilidad -= 0.2;
                break;
            case self::DIFICIL:
                $intervalo = max(1, (int) round($intervalo * 1.2));
                $repeticiones++;
                $facilidad -= 0.15;
                break;
            case self::BIEN:
                $intervalo = match ($repeticiones) {
                    0 => 1,
                    1 => max(3, $intervalo + 1),
                    default => max($intervalo + 1, (int) round($intervalo * $facilidad)),
                };
                $repeticiones++;
                break;
            case self::FACIL:
                $intervalo = $repeticiones === 0
                    ? 4
                    : max($intervalo + 2, (int) round($intervalo * $facilidad * 1.3));
                $repeticiones++;
                $facilidad += 0.15;
                break;
            default:
                throw new \InvalidArgumentException("Nota desconocida: {$nota}");
        }

        $t->intervalo = min($intervalo, self::MAX_INTERVALO);
        $t->facilidad = round(min(self::FACILIDAD_MAX, max(self::FACILIDAD_MIN, $facilidad)), 2);
        $t->repeticiones = $repeticiones;
        $t->repasada_on = $hoy;
        $t->proximo_repaso = $hoy->addDays($t->intervalo);
    }

    /** Marcarla a mano como aprendida: pasa a repasarse cada 3 semanas o más. */
    public static function marcarAprendida(PortuguesTarjeta $t, CarbonImmutable $hoy): void
    {
        $t->intervalo = max($t->intervalo, self::APRENDIDA);
        $t->repeticiones = max($t->repeticiones, 3);
        $t->proximo_repaso = $hoy->addDays($t->intervalo);
    }

    /** Quitarle la marca: vuelve a repasarse desde hoy. */
    public static function desmarcarAprendida(PortuguesTarjeta $t, CarbonImmutable $hoy): void
    {
        $t->intervalo = 0;
        $t->repeticiones = 0;
        $t->proximo_repaso = $hoy;
    }
}
