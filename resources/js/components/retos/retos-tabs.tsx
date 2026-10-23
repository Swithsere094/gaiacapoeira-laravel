import { ClipboardCheck, Network, Target, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageTabs } from '@/components/page-tabs';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from '@/lib/navigation';
import type { Permission } from '@/types';

/** Cada pestaña, con los permisos que la muestran (alguno de ellos). */
const TABS: {
    href: string;
    label: string;
    icon: LucideIcon;
    needs: Permission[];
}[] = [
    {
        href: '/retos',
        label: 'Mis retos',
        icon: Target,
        needs: ['retos.entrenar', 'retos.arbol'],
    },
    {
        href: '/retos/arbol',
        label: 'Árbol',
        icon: Network,
        needs: ['retos.arbol'],
    },
    {
        href: '/retos/revisiones',
        label: 'Revisiones',
        icon: ClipboardCheck,
        needs: ['retos.revisar'],
    },
    {
        href: '/retos/personas',
        label: 'Personas',
        icon: Users,
        needs: ['retos.revisar'],
    },
];

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
        <PageTabs
            label="Secciones de retos"
            tabs={tabs.map((tab) => ({
                key: tab.href,
                label: tab.label,
                icon: tab.icon,
                href: tab.href,
                active:
                    tab.href === '/retos'
                        ? pathname === '/retos'
                        : pathname.startsWith(tab.href),
                badge:
                    tab.href === '/retos/revisiones'
                        ? pendingReviews
                        : undefined,
            }))}
        />
    );
}
