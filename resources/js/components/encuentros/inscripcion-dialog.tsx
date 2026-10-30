import { router, useForm } from '@inertiajs/react';
import { Check, FileText, Trash2, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { FormError } from '@/components/form-error';
import { IconButton } from '@/components/icon-button';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/dates';
import {
    formatMoney,
    PAGO_LABELS,
    PAGO_REGISTRO_CLASSES,
    PAGO_REGISTRO_LABELS,
} from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { InscripcionRow, PagoRow } from '@/types/encuentros';

/**
 * Una inscripción, del lado del organizador: sus datos, el historial de
 * pagos (confirmar o rechazar los que reportó la persona, registrar uno
 * nuevo, quitar uno cargado por error) y notas o cancelarla. Recibe la
 * inscripción ya actualizada en cada recarga; quien lo usa le cambia el
 * `key` al abrir otra.
 */
export function InscripcionDialog({
    encuentroId,
    inscripcion,
    hoy,
    metodos,
    open,
    onOpenChange,
}: {
    encuentroId: string;
    inscripcion: InscripcionRow | null;
    hoy: string;
    metodos: string[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { confirm } = useConfirm();
    const saldo = inscripcion
        ? Math.max(0, inscripcion.precio_valor - inscripcion.monto_pagado)
        : 0;
    const pago = useForm({
        monto: saldo > 0 ? saldo.toString() : '',
        fecha: hoy,
        metodo: '',
        nota: '',
        comprobante: null as File | null,
    });
    const datosForm = useForm({
        estado: inscripcion?.estado ?? 'activa',
        notas: inscripcion?.notas ?? '',
    });

    if (!inscripcion) {
        return null;
    }

    const base = `/encuentros/${encuentroId}`;
    const opts = { preserveScroll: true, preserveState: true };

    const registrar = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        pago.post(`${base}/inscripciones/${inscripcion.id}/pagos`, {
            ...opts,
            forceFormData: true,
            onSuccess: () =>
                pago.setData((d) => ({
                    ...d,
                    monto: '',
                    nota: '',
                    comprobante: null,
                })),
        });
    };

    const revisar = (p: PagoRow, accion: 'confirmar' | 'rechazar') =>
        router.post(`${base}/pagos/${p.id}/${accion}`, {}, opts);

    const quitar = async (p: PagoRow) => {
        const ok = await confirm({
            title: `¿Quitar el pago de ${formatMoney(p.monto)}?`,
            description:
                'Úsalo si se registró por error. Se borra también su comprobante.',
            confirmLabel: 'Quitar',
            destructive: true,
        });
        if (ok) router.delete(`${base}/pagos/${p.id}`, opts);
    };

    const guardarDatos = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        datosForm.put(`${base}/inscripciones/${inscripcion.id}`, opts);
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
        ['Opción', inscripcion.precio_nombre],
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
                        {inscripcion.asistio && ' · llegó'}
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                        ['Valor', formatMoney(inscripcion.precio_valor)],
                        ['Pagado', formatMoney(inscripcion.monto_pagado)],
                        ['Falta', formatMoney(saldo)],
                    ].map(([k, v]) => (
                        <div key={k} className="rounded-lg bg-secondary/60 p-2">
                            <p className="text-xs text-muted-foreground">{k}</p>
                            <p className="font-medium text-foreground">{v}</p>
                        </div>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground">
                    Estado del pago: {PAGO_LABELS[inscripcion.pago_estado]}
                </p>

                {/* Historial de pagos */}
                <section className="space-y-2">
                    <h3 className="font-serif font-bold text-foreground">
                        Pagos
                    </h3>
                    {inscripcion.pagos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay pagos.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border rounded-lg border border-border">
                            {inscripcion.pagos.map((p) => (
                                <li key={p.id} className="space-y-2 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-medium text-foreground">
                                            {formatMoney(p.monto)}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded px-2 py-0.5 text-xs font-medium',
                                                PAGO_REGISTRO_CLASSES[p.estado],
                                            )}
                                        >
                                            {PAGO_REGISTRO_LABELS[p.estado]}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDate(p.fecha)}
                                            {p.metodo && ` · ${p.metodo}`}
                                            {p.origen === 'participante' &&
                                                ' · lo reportó la persona'}
                                        </span>
                                        <span className="ml-auto flex items-center gap-1">
                                            {p.comprobante && (
                                                <a
                                                    href={p.comprobante}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                    <FileText className="h-3.5 w-3.5" />
                                                    Comprobante
                                                </a>
                                            )}
                                            {p.estado !== 'reportado' && (
                                                <IconButton
                                                    icon={Trash2}
                                                    label="Quitar este pago"
                                                    tone="destructive"
                                                    size="sm"
                                                    onClick={() =>
                                                        void quitar(p)
                                                    }
                                                />
                                            )}
                                        </span>
                                    </div>
                                    {p.nota && (
                                        <p className="text-xs text-muted-foreground">
                                            {p.nota}
                                        </p>
                                    )}
                                    {p.estado === 'reportado' && (
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() =>
                                                    revisar(p, 'confirmar')
                                                }
                                            >
                                                <Check className="h-4 w-4" />
                                                Confirmar
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="gap-1"
                                                onClick={() =>
                                                    revisar(p, 'rechazar')
                                                }
                                            >
                                                <X className="h-4 w-4" />
                                                Rechazar
                                            </Button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Registrar un pago */}
                <form
                    onSubmit={registrar}
                    className="space-y-3 rounded-lg border border-border p-3"
                >
                    <h3 className="font-serif font-bold text-foreground">
                        Registrar un pago
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label htmlFor="pago-monto">Monto ($) *</Label>
                            <Input
                                id="pago-monto"
                                type="number"
                                min={1}
                                step={1000}
                                value={pago.data.monto}
                                onChange={(e) =>
                                    pago.setData('monto', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pago-fecha">Fecha *</Label>
                            <Input
                                id="pago-fecha"
                                type="date"
                                value={pago.data.fecha}
                                onChange={(e) =>
                                    pago.setData('fecha', e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="pago-metodo">
                                Método (opcional)
                            </Label>
                            <select
                                id="pago-metodo"
                                value={pago.data.metodo}
                                onChange={(e) =>
                                    pago.setData('metodo', e.target.value)
                                }
                                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground"
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
                    <div className="space-y-1">
                        <Label htmlFor="pago-comprobante">
                            Comprobante (opcional)
                        </Label>
                        <input
                            id="pago-comprobante"
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={(e) =>
                                pago.setData(
                                    'comprobante',
                                    e.target.files?.[0] ?? null,
                                )
                            }
                            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
                        />
                    </div>
                    <Input
                        aria-label="Nota del pago (opcional)"
                        value={pago.data.nota}
                        onChange={(e) => pago.setData('nota', e.target.value)}
                        maxLength={300}
                        placeholder="Nota (opcional). Ej.: pagó en efectivo a Pedro"
                    />
                    <FormError message={Object.values(pago.errors)[0]} />
                    <SubmitButton processing={pago.processing} size="sm">
                        Registrar pago
                    </SubmitButton>
                </form>

                {/* Datos */}
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

                {/* Notas y cancelar */}
                <form onSubmit={guardarDatos} className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="notas">Notas (opcional)</Label>
                        <Textarea
                            id="notas"
                            value={datosForm.data.notas}
                            onChange={(e) =>
                                datosForm.setData('notas', e.target.value)
                            }
                            rows={2}
                            maxLength={1000}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={datosForm.data.estado === 'cancelada'}
                            onChange={(e) =>
                                datosForm.setData(
                                    'estado',
                                    e.target.checked ? 'cancelada' : 'activa',
                                )
                            }
                            className="h-4 w-4 accent-[var(--primary)]"
                        />
                        Inscripción cancelada (no cuenta para el cupo ni el
                        recaudo)
                    </label>
                    <FormError message={Object.values(datosForm.errors)[0]} />
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cerrar
                        </Button>
                        <SubmitButton processing={datosForm.processing}>
                            Guardar notas
                        </SubmitButton>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
