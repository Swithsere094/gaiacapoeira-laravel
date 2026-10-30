import { Head, Link } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { LOCALE_NAMES, useT } from '@/lib/i18n';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';

/**
 * Marco de las páginas públicas de un encuentro (sin sesión): cabecera con
 * el nombre del grupo y el selector de idioma, y pie, sin la barra del
 * sitio. No se indexan en buscadores (decisión del usuario); el servidor
 * además manda `X-Robots-Tag: noindex`.
 */
export function PublicLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const { t, locale, disponibles } = useT();
    const pathname = usePathname();

    // Las visitas de Inertia no recargan el <html>: el idioma se actualiza acá.
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            {/* El sufijo hace que app.tsx no le agregue "Areia no Mar". */}
            <Head title={`${title} - Gaia Capoeira`}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* Fija arriba: el selector de idioma queda siempre a mano. */}
            <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground"
                    >
                        G
                    </span>
                    <span className="min-w-0 truncate font-serif text-lg font-bold text-foreground">
                        Gaia Capoeira
                    </span>
                    <nav
                        aria-label={t('idioma')}
                        className="ml-auto flex shrink-0 items-center gap-1"
                    >
                        <Globe
                            className="mr-1 h-4 w-4 text-muted-foreground"
                            aria-hidden="true"
                        />
                        {disponibles.map((l) => (
                            <Link
                                key={l}
                                href={`${pathname}?lang=${l}`}
                                preserveScroll
                                lang={l}
                                hrefLang={l}
                                title={LOCALE_NAMES[l]}
                                aria-label={LOCALE_NAMES[l]}
                                aria-current={l === locale ? 'true' : undefined}
                                className={cn(
                                    'rounded-md px-2 py-1 text-xs font-semibold tracking-wide uppercase transition-colors',
                                    l === locale
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                )}
                            >
                                {l}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
                Gaia Capoeira
            </footer>
        </div>
    );
}
