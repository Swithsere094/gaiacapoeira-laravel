import { Link } from '@inertiajs/react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { Permission } from '@/types';

/** Cada pestaña, con los permisos que la muestran (alguno de ellos). */
const TABS: { href: string; label: string; needs: Permission[] }[] = [
    {
        href: '/retos',
        label: 'Mis retos',
        needs: ['retos.entrenar', 'retos.arbol'],
    },
    { href: '/retos/arbol', label: 'Árbol', needs: ['retos.arbol'] },
    {
        href: '/retos/revisiones',
        label: 'Revisiones',
        needs: ['retos.revisar'],
    },
    { href: '/retos/personas', label: 'Personas', needs: ['retos.revisar'] },
];

/** En el celular, las pestañas en una fila de igual ancho. */
const COLS = ['', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4'];

/** Pestañas de la sección de retos (con las revisiones pendientes). */
export function RetosTabs({ pendingReviews }: { pendingReviews: number }) {
    const pathname = usePathname();
    const { can } = useAuth();
    const tabs = TABS.filter((tab) => tab.needs.some(can));

    // Con una sola pestaña (por ejemplo, solo Entrenar) no hace falta.
    if (tabs.length < 2) {
        return null;
    }

    return (
        <nav aria-label="Secciones de retos">
            <div
                className={cn(
                    'grid rounded-lg bg-secondary p-1 sm:inline-flex',
                    COLS[tabs.length],
                )}
            >
                {tabs.map((tab) => {
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
                                'flex items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:gap-1.5 sm:px-4 sm:text-sm',
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
