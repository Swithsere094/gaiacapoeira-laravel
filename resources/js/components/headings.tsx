import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Título que separa bloques de una página (debajo del encabezado). */
export function SectionTitle({
    icon: Icon,
    subtitle,
    className,
    children,
}: {
    icon?: LucideIcon;
    subtitle?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cn('mb-4', className)}>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
                {Icon && (
                    <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
                )}
                {children}
            </h2>
            {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
        </div>
    );
}

/** Título dentro de una tarjeta (`panel`). */
export function PanelTitle({
    icon: Icon,
    className,
    children,
}: {
    icon?: LucideIcon;
    className?: string;
    children: ReactNode;
}) {
    return (
        <h2
            className={cn(
                'flex items-center gap-2 font-serif text-lg font-bold text-card-foreground',
                className,
            )}
        >
            {Icon && (
                <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
            )}
            {children}
        </h2>
    );
}
