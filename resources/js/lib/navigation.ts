import { usePage } from '@inertiajs/react';

/**
 * Equivalentes de `usePathname()` / `useSearchParams()` de next/navigation,
 * para que los componentes portados del sitio Next no cambien de forma.
 */
export function usePathname(): string {
    const { url } = usePage();

    return url.split(/[?#]/)[0] || '/';
}

export function useSearchParams(): URLSearchParams {
    const { url } = usePage();
    const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';

    return new URLSearchParams(query);
}
