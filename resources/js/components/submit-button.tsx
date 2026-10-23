import { Loader2 } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/** Botón de enviar un formulario: mientras guarda, se desactiva y lo indica. */
export function SubmitButton({
    processing,
    pendingLabel = 'Guardando…',
    disabled,
    children,
    ...props
}: ComponentProps<typeof Button> & {
    processing: boolean;
    pendingLabel?: ReactNode;
}) {
    return (
        <Button type="submit" disabled={processing || disabled} {...props}>
            {processing ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {pendingLabel}
                </>
            ) : (
                children
            )}
        </Button>
    );
}
