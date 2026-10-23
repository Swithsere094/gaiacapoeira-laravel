import type { ReactNode } from 'react';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';

/** Pie de un formulario en ventana: "Cancelar" y el botón de guardar. */
export function FormActions({
    onCancel,
    processing,
    pendingLabel,
    children,
}: {
    onCancel: () => void;
    processing: boolean;
    pendingLabel?: ReactNode;
    /** Texto del botón de guardar. */
    children: ReactNode;
}) {
    return (
        <div className="flex justify-end gap-3 pt-2">
            <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={processing}
            >
                Cancelar
            </Button>
            <SubmitButton processing={processing} pendingLabel={pendingLabel}>
                {children}
            </SubmitButton>
        </div>
    );
}
