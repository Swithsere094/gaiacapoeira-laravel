import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

/**
 * Botón de solo ícono (editar, eliminar…). `label` es lo que lee el lector
 * de pantalla y el texto que aparece al pasar el mouse. En el celular es más
 * grande (36 px) para que se pueda tocar con el dedo.
 */
export function IconButton({
    icon: Icon,
    label,
    tone = 'default',
    size = 'md',
    className,
    ...props
}: Omit<ComponentProps<'button'>, 'children'> & {
    icon: LucideIcon;
    label: string;
    tone?: 'default' | 'destructive';
    size?: 'sm' | 'md';
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                'shrink-0 cursor-pointer rounded-md text-muted-foreground transition-colors',
                size === 'sm' ? 'p-2.5 sm:p-1.5' : 'p-2.5 sm:p-2',
                tone === 'destructive'
                    ? 'hover:bg-destructive/10 hover:text-destructive'
                    : 'hover:bg-secondary hover:text-foreground',
                className,
            )}
            {...props}
        >
            <Icon aria-hidden="true" className="h-4 w-4" />
        </button>
    );
}
