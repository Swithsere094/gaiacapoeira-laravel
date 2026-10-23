import { cn } from '@/lib/utils';

/** Error de un formulario (del servidor o de la validación en el navegador). */
export function FormError({
    message,
    className,
}: {
    message?: string | null | false;
    className?: string;
}) {
    if (!message) {
        return null;
    }

    return (
        <p
            role="alert"
            className={cn(
                'rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive',
                className,
            )}
        >
            {message}
        </p>
    );
}
