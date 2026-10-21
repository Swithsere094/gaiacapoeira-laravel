import type { LucideIcon } from 'lucide-react';
import { categoryIcon, skillIcon } from '@/lib/icons';
import type { RetoResumen } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Ícono de un reto: el de su habilidad o, si es suelto, el de su categoría. */
export function retoIcon(
    reto: Pick<RetoResumen, 'habilidad' | 'category'>,
): LucideIcon {
    return reto.habilidad
        ? skillIcon(reto.habilidad.icon)
        : categoryIcon(reto.category);
}

/** El ícono en un círculo dorado, para las tarjetas de retos. */
export function IconBadge({
    icon: Icon,
    className,
}: {
    icon: LucideIcon;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/60 bg-primary/10 text-primary',
                className,
            )}
        >
            <Icon className="h-5 w-5" />
        </span>
    );
}
