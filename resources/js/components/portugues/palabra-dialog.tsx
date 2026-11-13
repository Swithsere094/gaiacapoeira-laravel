import { useState } from 'react';
import { AsociacionForm } from '@/components/portugues/asociacion-form';
import { PalabraCabecera } from '@/components/portugues/palabra-detalle';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { enviar } from '@/lib/portugues';
import type { Palabra, Tarjeta } from '@/types/portugues';

/**
 * Trabajar o editar una palabra desde la lista: su asociación, y marcarla
 * como aprendida o volver a proponerla si se había saltado.
 */
export function PalabraDialog({
    palabra,
    tarjeta,
    onClose,
}: {
    palabra: Palabra | null;
    tarjeta: Tarjeta | undefined;
    onClose: () => void;
}) {
    const [busy, setBusy] = useState(false);

    const accion = (method: 'post' | 'delete', ruta: string) => {
        if (!palabra) {
            return;
        }

        setBusy(true);
        enviar(
            method,
            `/portugues/palabras/${palabra.id}/${ruta}`,
            {},
            {
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <Dialog open={palabra !== null} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="sr-only">
                        {palabra?.palabra}
                    </DialogTitle>
                </DialogHeader>
                {palabra && (
                    <div className="space-y-5">
                        <PalabraCabecera palabra={palabra} tarjeta={tarjeta} />

                        <AsociacionForm
                            key={palabra.id}
                            palabra={palabra}
                            tarjeta={tarjeta}
                            submitLabel="Guardar cambios"
                            onSaved={onClose}
                            actions={
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                >
                                    Cancelar
                                </Button>
                            }
                        />

                        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                            {tarjeta?.estado === 'aprendida' ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() =>
                                        accion('delete', 'aprendida')
                                    }
                                >
                                    Quitar de aprendidas
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => accion('post', 'aprendida')}
                                >
                                    Marcar como aprendida
                                </Button>
                            )}
                            {tarjeta?.saltada && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => accion('delete', 'saltar')}
                                >
                                    Volver a proponerla
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
