import { usePage } from '@inertiajs/react';

/**
 * Idioma de las páginas públicas de un encuentro (el resto del sitio es solo
 * en español). El servidor elige el idioma (App\Support\EncuentroIdioma) y
 * comparte los textos de `lang/{es,pt,en}/encuentro.php` → `ui` en la prop
 * `idioma`.
 */

export type Locale = 'es' | 'pt' | 'en';

interface Idioma {
    actual: Locale;
    disponibles: Locale[];
    textos: Record<string, unknown>;
}

/** Nombre de cada idioma en su propio idioma (para el selector). */
export const LOCALE_NAMES: Record<Locale, string> = {
    es: 'Español',
    pt: 'Português',
    en: 'English',
};

/** Código de Intl para fechas y horas. */
export const INTL_LOCALES: Record<Locale, string> = {
    es: 'es-ES',
    pt: 'pt-BR',
    en: 'en-US',
};

/**
 * `t('campos.nombre')` o `t('abiertas_hasta', { fecha })`: los `:nombre`
 * del texto se reemplazan por los valores dados. Si falta la clave
 * devuelve la clave (se nota enseguida en la pantalla).
 */
export function useT() {
    const idioma = usePage<{ idioma?: Idioma }>().props.idioma;
    const locale = idioma?.actual ?? 'es';

    const t = (key: string, params: Record<string, string> = {}): string => {
        let value: unknown = idioma?.textos;
        for (const part of key.split('.')) {
            value =
                value && typeof value === 'object'
                    ? (value as Record<string, unknown>)[part]
                    : undefined;
        }
        if (typeof value !== 'string') {
            return key;
        }

        return Object.entries(params).reduce(
            (text, [name, replacement]) =>
                text.replaceAll(`:${name}`, replacement),
            value,
        );
    };

    return { t, locale, disponibles: idioma?.disponibles ?? ['es'] };
}
