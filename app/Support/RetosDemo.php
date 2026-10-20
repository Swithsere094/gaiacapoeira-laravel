<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

/**
 * Controles de prueba del demo de retos, guardados en la sesión de quien
 * prueba (solo afectan a esa persona, en ese navegador):
 *
 *  - día simulado: "hoy" corrido N días hacia adelante, para recorrer una
 *    semana de reto en minutos;
 *  - cronómetro rápido: los entrenamientos que se empiezan duran 30 veces
 *    menos (el servidor exige esa duración más corta).
 *
 * Al abrir los retos a los miembros (fase E) esto se quita.
 */
final class RetosDemo
{
    private const OFFSET = 'retos_demo.offset';

    private const FAST = 'retos_demo.fast';

    /** Cuántas veces más rápido corre el cronómetro rápido. */
    public const FAST_FACTOR = 30;

    public static function offset(Request $request): int
    {
        return (int) $request->session()->get(self::OFFSET, 0);
    }

    /** Hoy en Colombia, más los días simulados. */
    public static function today(Request $request): CarbonImmutable
    {
        return EventCalendar::today()->addDays(self::offset($request));
    }

    public static function fast(Request $request): bool
    {
        return (bool) $request->session()->get(self::FAST, false);
    }

    public static function nextDay(Request $request): void
    {
        $request->session()->put(self::OFFSET, self::offset($request) + 1);
    }

    public static function backToToday(Request $request): void
    {
        $request->session()->forget(self::OFFSET);
    }

    public static function toggleFast(Request $request): void
    {
        $request->session()->put(self::FAST, ! self::fast($request));
    }

    public static function progreso(Request $request): Progreso
    {
        return new Progreso($request->user(), self::today($request));
    }

    /** @return array{today: string, offset: int, fast: bool} */
    public static function toArray(Request $request): array
    {
        return [
            'today' => self::today($request)->toDateString(),
            'offset' => self::offset($request),
            'fast' => self::fast($request),
        ];
    }
}
