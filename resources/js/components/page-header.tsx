import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { usePageContainer } from '@/components/page-layout';
import { cn } from '@/lib/utils';

/**
 * Encabezado de página: franja con degradado, ícono de la sección, título,
 * descripción y, a la derecha, acciones (ej. "Nuevo evento"). Va en la prop
 * `header` de <PageLayout>, que le da el mismo ancho que al contenido.
 */
export function PageHeader({
    icon: Icon,
    title,
    description,
    actions,
    children,
}: {
    icon?: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    /** Contenido extra debajo del título (ej. avisos de la sección). */
    children?: ReactNode;
}) {
    return (
        <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
            <div className={cn(usePageContainer(), 'py-12')}>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="mb-2 flex items-center gap-3 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            {Icon && (
                                <Icon
                                    aria-hidden="true"
                                    className="h-8 w-8 shrink-0 text-primary md:h-10 md:w-10"
                                />
                            )}
                            <span className="min-w-0">{title}</span>
                        </h1>
                        {description && (
                            <div className="max-w-2xl text-lg text-muted-foreground">
                                {description}
                            </div>
                        )}
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}
