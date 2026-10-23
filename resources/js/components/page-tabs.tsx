import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { usePageContainer } from '@/components/page-layout';
import { cn } from '@/lib/utils';

export interface PageTab {
    key: string;
    label: string;
    icon?: LucideIcon;
    active: boolean;
    /** Pestaña que navega a otra página… */
    href?: string;
    /** …o que cambia algo en la misma página. */
    onClick?: () => void;
    /** Número destacado al lado (ej. revisiones pendientes). */
    badge?: number;
}

/**
 * Pestañas de una página, debajo del encabezado. Se quedan pegadas bajo la
 * barra al bajar (`top-16` = alto de la barra achicada). En el celular se
 * reparten el ancho en partes iguales. Va en la prop `tabs` de <PageLayout>.
 */
export function PageTabs({ tabs, label }: { tabs: PageTab[]; label: string }) {
    const container = usePageContainer();

    return (
        <nav
            aria-label={label}
            className="sticky top-16 z-30 border-b border-border bg-background"
        >
            <div className={container}>
                <div className="-mb-px flex gap-1">
                    {tabs.map((tab) => {
                        const className = cn(
                            'flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-4 text-[13px] font-medium whitespace-nowrap transition-colors sm:flex-none sm:gap-2 sm:px-6 sm:text-sm',
                            tab.active
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        );
                        const content = (
                            <>
                                {tab.icon && (
                                    <tab.icon
                                        aria-hidden="true"
                                        className="hidden h-4 w-4 sm:block"
                                    />
                                )}
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                        {tab.badge}
                                    </span>
                                )}
                            </>
                        );

                        return tab.href ? (
                            <Link
                                key={tab.key}
                                href={tab.href}
                                aria-current={tab.active ? 'page' : undefined}
                                className={className}
                            >
                                {content}
                            </Link>
                        ) : (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={tab.onClick}
                                aria-pressed={tab.active}
                                className={className}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
