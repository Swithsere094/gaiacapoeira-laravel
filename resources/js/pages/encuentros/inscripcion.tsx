import { Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Copy, Upload, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { PublicLayout } from '@/components/encuentros/public-layout';
import { FlashMessage } from '@/components/flash-message';
import { FormError } from '@/components/form-error';
import { PanelTitle } from '@/components/headings';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/dates';
import {
    formatMoney,
    formatRange,
    PAGO_LABELS,
    PAGO_REGISTRO_CLASSES,
    PAGO_REGISTRO_LABELS,
} from '@/lib/encuentros';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { EncuentroPublico, PagoEstado, PagoRow } from '@/types/encuentros';

interface Inscripcion {
    codigo: string;
    nombre: string;
    apelido: string | null;
    grupo: string;
    precio_nombre: string;
    precio_valor: number;
    pago_estado: PagoEstado;
    monto_pagado: number;
    saldo: number;
    estado: 'activa' | 'cancelada';
    created_at: string;
    pagos: PagoRow[];
}

/**
 * Confirmación de la inscripción y consulta posterior con el enlace
 * privado. Sin correo (todavía): la persona le toma captura o guarda el
 * enlace.
 */
export default function InscripcionPage({
    encuentro,
    inscripcion,
    metodos,
}: {
    encuentro: EncuentroPublico;
    inscripcion: Inscripcion;
    metodos: string[];
}) {
    const [copied, setCopied] = useState(false);
    const cancelada = inscripcion.estado === 'cancelada';
    // El token es el último tramo de la dirección (/inscripcion/{token}).
    const token = usePathname().split('/').pop() ?? '';

    const copiar = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const filas: [string, string][] = [
        [
            'Nombre',
            inscripcion.apelido
                ? `${inscripcion.nombre} «${inscripcion.apelido}»`
                : inscripcion.nombre,
        ],
        ['Grupo', inscripcion.grupo],
        ['Opción', inscripcion.precio_nombre],
        ['Valor', formatMoney(inscripcion.precio_valor)],
        [
            'Pago',
            `${PAGO_LABELS[inscripcion.pago_estado]}${inscripcion.monto_pagado > 0 ? ` · pagado ${formatMoney(inscripcion.monto_pagado)}` : ''}`,
        ],
        ['Falta pagar', formatMoney(inscripcion.saldo)],
        ['Inscrito el', formatDate(inscripcion.created_at)],
    ];

    return (
        <PublicLayout title={`Inscripción · ${encuentro.nombre}`}>
            <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
                <div className="text-center">
                    <CheckCircle2
                        className="mx-auto h-14 w-14 text-primary"
                        aria-hidden="true"
                    />
                    <h1 className="mt-3 font-serif text-3xl font-bold text-foreground">
                        {cancelada
                            ? 'Inscripción cancelada'
                            : '¡Inscripción recibida!'}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {encuentro.nombre} ·{' '}
                        {formatRange(encuentro.starts_on, encuentro.ends_on)}
                    </p>
                </div>

                <div className="panel p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                        Tu código de inscripción
                    </p>
                    <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-primary">
                        {inscripcion.codigo}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Tómale una captura a esta pantalla: es tu comprobante de
                        inscripción.
                    </p>
                </div>

                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 panel p-5 text-sm">
                    {filas.map(([k, v]) => (
                        <div key={k} className="contents">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="text-right font-medium text-foreground">
                                {v}
                            </dd>
                        </div>
                    ))}
                </dl>

                {encuentro.info_pago && !cancelada && inscripcion.saldo > 0 && (
                    <section className="space-y-2 panel p-5">
                        <PanelTitle icon={Wallet}>Datos de pago</PanelTitle>
                        <p className="text-sm whitespace-pre-line text-foreground">
                            {encuentro.info_pago}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Cuando pagues, sube el comprobante aquí abajo o
                            mándaselo a los organizadores con tu código{' '}
                            <span className="font-mono whitespace-nowrap">
                                {inscripcion.codigo}
                            </span>
                            .
                        </p>
                    </section>
                )}

                <FlashMessage />

                {inscripcion.pagos.length > 0 && (
                    <section className="space-y-2 panel p-5">
                        <PanelTitle>Tus pagos</PanelTitle>
                        <ul className="divide-y divide-border text-sm">
                            {inscripcion.pagos.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex flex-wrap items-center gap-2 py-2"
                                >
                                    <span className="font-medium text-foreground">
                                        {formatMoney(p.monto)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {formatDate(p.fecha)}
                                        {p.metodo && ` · ${p.metodo}`}
                                    </span>
                                    <span
                                        className={cn(
                                            'ml-auto rounded px-2 py-0.5 text-xs font-medium',
                                            PAGO_REGISTRO_CLASSES[p.estado],
                                        )}
                                    >
                                        {PAGO_REGISTRO_LABELS[p.estado]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {inscripcion.pagos.some(
                            (p) => p.estado === 'reportado',
                        ) && (
                            <p className="text-xs text-muted-foreground">
                                Los pagos "por revisar" se suman cuando los
                                organizadores los confirman.
                            </p>
                        )}
                    </section>
                )}

                {!cancelada && inscripcion.saldo > 0 && (
                    <ReportarPago
                        url={`${encuentro.base}/inscripcion/${token}/pago`}
                        saldo={inscripcion.saldo}
                        metodos={metodos}
                    />
                )}

                <section className="space-y-2 panel p-5">
                    <PanelTitle>Volver a consultar tu inscripción</PanelTitle>
                    <p className="text-sm text-muted-foreground">
                        Este enlace es privado: guárdalo para ver más adelante
                        el estado de tu pago.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => void copiar()}
                    >
                        <Copy className="h-4 w-4" />
                        {copied ? '¡Enlace copiado!' : 'Copiar el enlace'}
                    </Button>
                </section>

                <div className="text-center">
                    <Button asChild variant="ghost">
                        <Link href={encuentro.base || '/'}>
                            Volver a la página del encuentro
                        </Link>
                    </Button>
                </div>
            </div>
        </PublicLayout>
    );
}

/** Mandar un comprobante de pago después de inscribirse (queda por revisar). */
function ReportarPago({
    url,
    saldo,
    metodos,
}: {
    url: string;
    saldo: number;
    metodos: string[];
}) {
    const form = useForm({
        monto: saldo.toString(),
        metodo: '',
        nota: '',
        comprobante: null as File | null,
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <section className="space-y-3 panel p-5">
            <PanelTitle icon={Upload}>Mandar un comprobante de pago</PanelTitle>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="monto">Cuánto pagaste ($) *</Label>
                        <Input
                            id="monto"
                            type="number"
                            min={1}
                            step={1000}
                            value={form.data.monto}
                            onChange={(e) =>
                                form.setData('monto', e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="metodo">Cómo pagaste (opcional)</Label>
                        <select
                            id="metodo"
                            value={form.data.metodo}
                            onChange={(e) =>
                                form.setData('metodo', e.target.value)
                            }
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm text-foreground"
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
                    <Label htmlFor="comprobante">
                        Comprobante (foto o PDF, máx. 10 MB) *
                    </Label>
                    <input
                        id="comprobante"
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
                <SubmitButton
                    processing={form.processing}
                    pendingLabel="Enviando…"
                >
                    Mandar comprobante
                </SubmitButton>
            </form>
        </section>
    );
}
