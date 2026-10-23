import { Head } from '@inertiajs/react';
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { cn } from '@/lib/utils';

/** Ancho del contenido; el encabezado de la página usa el mismo. */
const WIDTHS = {
    narrow: 'max-w-3xl',
    medium: 'max-w-4xl',
    wide: 'max-w-7xl',
} as const;

export type PageWidth = keyof typeof WIDTHS;

const WidthContext = createContext<PageWidth>('wide');

/** Clases del contenedor centrado con el ancho de la página actual. */
export function usePageContainer(): string {
    return cn('mx-auto px-4 sm:px-6 lg:px-8', WIDTHS[useContext(WidthContext)]);
}

/**
 * Estructura de las páginas internas: barra, encabezado (franja con el
 * título), pestañas opcionales, contenido y pie. El `pt-24` deja el lugar de
 * la barra fija (96 px de alto arriba de todo); el aire bajo la barra lo da
 * la franja del encabezado.
 */
export function PageLayout({
    title,
    width = 'wide',
    header,
    tabs,
    children,
    className,
}: {
    /** Título de la pestaña del navegador. */
    title: string;
    width?: PageWidth;
    /** Normalmente un <PageHeader>. */
    header?: ReactNode;
    /** Normalmente un <PageTabs>, pegado debajo del encabezado. */
    tabs?: ReactNode;
    children: ReactNode;
    /** Clases extra para el contenedor del contenido. */
    className?: string;
}) {
    return (
        <WidthContext.Provider value={width}>
            <div className="min-h-screen bg-background">
                <Head title={title} />
                <Navigation />

                <main className="pt-24">
                    {header}
                    {tabs}
                    <div
                        className={cn(
                            'mx-auto px-4 pt-10 pb-20 sm:px-6 lg:px-8',
                            WIDTHS[width],
                            className,
                        )}
                    >
                        {children}
                    </div>
                </main>

                <Footer />
            </div>
        </WidthContext.Provider>
    );
}
