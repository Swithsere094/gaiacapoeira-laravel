<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Idioma de las páginas públicas de un encuentro (el resto del sitio es solo
 * en español). Orden: `?lang=` (se recuerda en la sesión) → lo elegido antes
 * en la sesión → el idioma del navegador → español.
 */
class EncuentroIdioma
{
    /** Idioma en que escribe el organizador (las columnas sin traducir). */
    public const ORIGINAL = 'es';

    public const LOCALES = ['es', 'pt', 'en'];

    /** Idiomas a los que el organizador puede traducir. */
    public const TRADUCCIONES = ['pt', 'en'];

    private const SESSION_KEY = 'encuentro_locale';

    public static function detectar(Request $request): string
    {
        $pedido = $request->query('lang');
        if (is_string($pedido) && in_array($pedido, self::LOCALES, true)) {
            $request->session()->put(self::SESSION_KEY, $pedido);

            return $pedido;
        }

        return self::elegido($request) ?? ($request->getPreferredLanguage(self::LOCALES) ?? self::ORIGINAL);
    }

    /** Lo que la persona eligió a mano (en esta visita o antes), o null. */
    public static function elegido(Request $request): ?string
    {
        $guardado = $request->hasSession() ? $request->session()->get(self::SESSION_KEY) : null;

        return is_string($guardado) && in_array($guardado, self::LOCALES, true) ? $guardado : null;
    }

    /**
     * Limpia las traducciones que llegan del formulario: solo idiomas y
     * campos conocidos, sin espacios sobrantes ni textos vacíos.
     *
     * @param  list<string>  $campos
     * @return array<string, array<string, string>>|null
     */
    public static function limpiar(mixed $traducciones, array $campos): ?array
    {
        if (! is_array($traducciones)) {
            return null;
        }

        $limpio = [];
        foreach (self::TRADUCCIONES as $locale) {
            foreach ($campos as $campo) {
                $texto = $traducciones[$locale][$campo] ?? null;
                if (is_string($texto) && trim($texto) !== '') {
                    $limpio[$locale][$campo] = trim($texto);
                }
            }
        }

        return $limpio === [] ? null : $limpio;
    }
}
