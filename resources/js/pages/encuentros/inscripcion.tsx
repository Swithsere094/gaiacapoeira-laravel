import { Link } from '@inertiajs/react';
import { CheckCircle2, Copy, Wallet } from 'lucide-react';
import { useState } from 'react';
import { PublicLayout } from '@/components/encuentros/public-layout';
import { PanelTitle } from '@/components/headings';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/dates';
import { formatMoney, formatRange, PAGO_LABELS } from '@/lib/encuentros';
import type { EncuentroPublico, PagoEstado } from '@/types/encuentros';

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
}

/**
 * Confirmación de la inscripción y consulta posterior con el enlace
 * privado. Sin correo (todavía): la persona le toma captura o guarda el
 * enlace.
 */
export default function InscripcionPage({
    encuentro,
    inscripcion,
}: {
    encuentro: EncuentroPublico;
    inscripcion: Inscripcion;
}) {
    const [copied, setCopied] = useState(false);
    const cancelada = inscripcion.estado === 'cancelada';

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
                            Cuando pagues, manda el comprobante a los
                            organizadores con tu código{' '}
                            <span className="font-mono whitespace-nowrap">
                                {inscripcion.codigo}
                            </span>
                            .
                        </p>
                    </section>
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
