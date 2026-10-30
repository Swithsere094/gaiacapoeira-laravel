import { useForm } from '@inertiajs/react';
import { Paperclip } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormActions } from '@/components/form-actions';
import { FormError } from '@/components/form-error';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Movimiento } from '@/types/encuentros';

const SELECT =
    'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground';

/**
 * Anotar o editar un gasto u otro ingreso de la contabilidad. Empieza de
 * cero en cada apertura: quien lo usa le cambia el `key`.
 */
export function MovimientoFormDialog({
    open,
    onOpenChange,
    encuentroId,
    tipo,
    movimiento,
    categorias,
    metodos,
    hoy,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    encuentroId: string;
    tipo: Movimiento['tipo'];
    /** null = nuevo. */
    movimiento: Movimiento | null;
    categorias: string[];
    metodos: string[];
    hoy: string;
}) {
    const form = useForm({
        tipo,
        fecha: movimiento?.fecha ?? hoy,
        concepto: movimiento?.concepto ?? '',
        categoria: movimiento?.categoria ?? '',
        monto: movimiento?.monto.toString() ?? '',
        metodo: movimiento?.metodo ?? '',
        nota: movimiento?.nota ?? '',
        comprobante: null as File | null,
        quitar_comprobante: 0,
    });
    const { data } = form;
    const gasto = tipo === 'gasto';
    const titulo = movimiento
        ? gasto
            ? 'Editar gasto'
            : 'Editar ingreso'
        : gasto
          ? 'Nuevo gasto'
          : 'Nuevo ingreso';

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };
        // Con archivo, PHP no interpreta un PUT real: va como POST + _method.
        if (movimiento) {
            form.transform((d) => ({ ...d, _method: 'put' }));
            form.post(
                `/encuentros/${encuentroId}/movimientos/${movimiento.id}`,
                options,
            );
        } else {
            form.post(`/encuentros/${encuentroId}/movimientos`, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{titulo}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="m-concepto">Concepto *</Label>
                        <Input
                            id="m-concepto"
                            value={data.concepto}
                            onChange={(e) =>
                                form.setData('concepto', e.target.value)
                            }
                            required
                            maxLength={150}
                            placeholder={
                                gasto
                                    ? 'Ej.: Alquiler del coliseo'
                                    : 'Ej.: Patrocinio de la tienda del barrio'
                            }
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="m-fecha">Fecha *</Label>
                            <Input
                                id="m-fecha"
                                type="date"
                                value={data.fecha}
                                onChange={(e) =>
                                    form.setData('fecha', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="m-monto">Monto ($) *</Label>
                            <Input
                                id="m-monto"
                                type="number"
                                min={1}
                                step={1}
                                value={data.monto}
                                onChange={(e) =>
                                    form.setData('monto', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="m-categoria">Categoría *</Label>
                            <select
                                id="m-categoria"
                                value={data.categoria}
                                onChange={(e) =>
                                    form.setData('categoria', e.target.value)
                                }
                                required
                                className={SELECT}
                            >
                                <option value="">Elige una</option>
                                {categorias.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="m-metodo">Método (opcional)</Label>
                            <select
                                id="m-metodo"
                                value={data.metodo}
                                onChange={(e) =>
                                    form.setData('metodo', e.target.value)
                                }
                                className={SELECT}
                            >
                                <option value="">—</option>
                                {metodos.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-nota">Nota (opcional)</Label>
                        <Input
                            id="m-nota"
                            value={data.nota}
                            onChange={(e) =>
                                form.setData('nota', e.target.value)
                            }
                            maxLength={300}
                            placeholder="Ej.: Pagado por Pedro, se le devuelve"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="m-comprobante">
                            Comprobante (opcional, foto o PDF, máx. 10 MB)
                        </Label>
                        {movimiento?.comprobante &&
                            !data.comprobante &&
                            !data.quitar_comprobante && (
                                <p className="flex items-center gap-2 text-sm">
                                    <a
                                        href={movimiento.comprobante}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Paperclip className="h-3.5 w-3.5" />
                                        Ver el comprobante guardado
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData(
                                                'quitar_comprobante',
                                                1,
                                            )
                                        }
                                        className="text-muted-foreground hover:text-destructive"
                                    >
                                        Quitar
                                    </button>
                                </p>
                            )}
                        <input
                            id="m-comprobante"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={(e) =>
                                form.setData(
                                    'comprobante',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
                        />
                    </div>

                    <FormError message={Object.values(form.errors)[0]} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={form.processing}
                    >
                        {movimiento
                            ? 'Guardar cambios'
                            : gasto
                              ? 'Crear gasto'
                              : 'Crear ingreso'}
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
