import { Link } from '@inertiajs/react';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';

const TABS = [
    { href: '/retos', label: 'Mis retos' },
    { href: '/retos/arbol', label: 'Árbol' },
    { href: '/retos/revisiones', label: 'Revisiones' },
    { href: '/retos/personas', label: 'Personas' },
];

/** Pestañas de la sección de retos (con las revisiones pendientes). */
export function RetosTabs({ pendingReviews }: { pendingReviews: number }) {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Secciones de retos"
            className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
            <div className="inline-flex rounded-lg bg-secondary p-1">
                {TABS.map((tab) => {
                    const active =
                        tab.href === '/retos'
                            ? pathname === '/retos'
                            : pathname.startsWith(tab.href);

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                                'flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                active
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {tab.label}
                            {tab.href === '/retos/revisiones' &&
                                pendingReviews > 0 && (
                                    <span
                                        className={cn(
                                            'rounded-full px-1.5 text-xs font-semibold',
                                            active
                                                ? 'bg-primary-foreground/20'
                                                : 'bg-primary text-primary-foreground',
                                        )}
                                    >
                                        {pendingReviews}
                                    </span>
                                )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
