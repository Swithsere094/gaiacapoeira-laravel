import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Lista vacía ("Aún no hay…"), con ícono y acción opcionales. */
export function EmptyState({
    icon: Icon,
    action,
    className,
    children,
}: {
    icon?: LucideIcon;
    /** Botón para empezar (ej. "Crear la primera"). */
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border border-dashed border-border px-6 py-12 text-center',
                className,
            )}
        >
            {Icon && (
                <Icon
                    aria-hidden="true"
                    className="mx-auto mb-4 h-10 w-10 text-muted-foreground"
                />
            )}
            <p className="text-muted-foreground">{children}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
