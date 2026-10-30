import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

/**
 * Marco de las páginas públicas de un encuentro (sin sesión): cabecera con
 * el nombre del grupo y pie, sin la barra del sitio. No se indexan en
 * buscadores (decisión del usuario); el servidor además manda
 * `X-Robots-Tag: noindex`.
 */
export function PublicLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title={title}>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <header className="border-b border-border">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 sm:px-6">
                    <span
                        aria-hidden="true"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground"
                    >
                        A
                    </span>
                    <span className="font-serif text-lg font-bold text-foreground">
                        Gaia Capoeira · Areia no Mar
                    </span>
                </div>
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
                Gaia Capoeira · Areia no Mar
            </footer>
        </div>
    );
}
