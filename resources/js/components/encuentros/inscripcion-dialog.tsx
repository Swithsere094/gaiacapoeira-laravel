import { useForm } from '@inertiajs/react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/dates';
import { formatMoney, PAGO_LABELS } from '@/lib/encuentros';
import type { InscripcionRow, PagoEstado } from '@/types/encuentros';

/**
 * Ver los datos de una inscripción y marcar el pago a mano (o cancelarla).
 * Arranca con los datos de la inscripción: quien lo usa le cambia el `key`.
 */
export function InscripcionDialog({
    encuentroId,
    inscripcion,
    open,
    onOpenChange,
}: {
    encuentroId: string;
    inscripcion: InscripcionRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const form = useForm({
        pago_estado: inscripcion?.pago_estado ?? 'pendiente',
        monto_pagado: inscripcion?.monto_pagado.toString() ?? '0',
        estado: inscripcion?.estado ?? 'activa',
        notas: inscripcion?.notas ?? '',
    });

    if (!inscripcion) {
        return null;
    }

    // Al marcar "Pagado", el monto pasa a ser el valor completo (se puede corregir).
    const setPago = (estado: PagoEstado) =>
        form.setData((d) => ({
            ...d,
            pago_estado: estado,
            monto_pagado:
                estado === 'pagado'
                    ? inscripcion.precio_valor.toString()
                    : estado === 'pendiente'
                      ? '0'
                      : d.monto_pagado,
        }));

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.put(`/encuentros/${encuentroId}/inscripciones/${inscripcion.id}`, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        });
    };

    const datos: [string, string | null][] = [
        ['Grupo', inscripcion.grupo],
        ['Profesor', inscripcion.profesor],
        ['Graduación', inscripcion.graduacion],
        ['Ciudad', inscripcion.ciudad],
        ['Teléfono', inscripcion.telefono],
        ['Correo', inscripcion.email],
        ['Talla', inscripcion.talla],
        [
            'Emergencia',
            `${inscripcion.emergencia_nombre} · ${inscripcion.emergencia_telefono}`,
        ],
        [
            'Opción',
            `${inscripcion.precio_nombre} — ${formatMoney(inscripcion.precio_valor)}`,
        ],
        ['Inscrito', formatDate(inscripcion.created_at)],
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {inscripcion.nombre}
                        {inscripcion.apelido && ` «${inscripcion.apelido}»`}
                    </DialogTitle>
                    <p className="font-mono text-sm text-muted-foreground">
                        {inscripcion.codigo}
                    </p>
                </DialogHeader>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    {datos
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                            <div key={k} className="contents">
                                <dt className="text-muted-foreground">{k}</dt>
                                <dd className="break-words text-foreground">
                                    {v}
                                </dd>
                            </div>
                        ))}
                </dl>

                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="pago_estado">Pago</Label>
                            <Select
                                value={form.data.pago_estado}
                                onValueChange={(v) => setPago(v as PagoEstado)}
                            >
                                <SelectTrigger id="pago_estado">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(
                                        Object.keys(PAGO_LABELS) as PagoEstado[]
                                    ).map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {PAGO_LABELS[p]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="monto_pagado">Pagado ($)</Label>
                            <Input
                                id="monto_pagado"
                                type="number"
                                min={0}
                                step={1000}
                                value={form.data.monto_pagado}
                                onChange={(e) =>
                                    form.setData('monto_pagado', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notas">Notas (opcional)</Label>
                        <Textarea
                            id="notas"
                            value={form.data.notas}
                            onChange={(e) =>
                                form.setData('notas', e.target.value)
                            }
                            rows={2}
                            maxLength={1000}
                            placeholder="Ej.: pagó por Nequi el 3 de mayo"
                        />
                    </div>

                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={form.data.estado === 'cancelada'}
                            onChange={(e) =>
                                form.setData(
                                    'estado',
                                    e.target.checked ? 'cancelada' : 'activa',
                                )
                            }
                            className="h-4 w-4 accent-[var(--primary)]"
                        />
                        Inscripción cancelada (no cuenta para el cupo ni el
                        recaudo)
                    </label>

                    <FormError message={Object.values(form.errors)[0]} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={form.processing}
                    >
                        Guardar cambios
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
