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
    PAGO_REGISTRO_CLASSES,
} from '@/lib/encuentros';
import { INTL_LOCALES, useT } from '@/lib/i18n';
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
    const { t, locale } = useT();
    const fecha = (value: string) =>
        formatDate(value, 'long', INTL_LOCALES[locale]);
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
            t('confirmacion.nombre'),
            inscripcion.apelido
                ? `${inscripcion.nombre} «${inscripcion.apelido}»`
                : inscripcion.nombre,
        ],
        [t('confirmacion.grupo'), inscripcion.grupo],
        [t('confirmacion.opcion'), inscripcion.precio_nombre],
        [t('confirmacion.valor'), formatMoney(inscripcion.precio_valor)],
        [
            t('confirmacion.pago'),
            `${t(`pago_estados.${inscripcion.pago_estado}`)}${inscripcion.monto_pagado > 0 ? ` · ${t('confirmacion.pagado', { monto: formatMoney(inscripcion.monto_pagado) })}` : ''}`,
        ],
        [t('confirmacion.falta'), formatMoney(inscripcion.saldo)],
        [t('confirmacion.fecha'), fecha(inscripcion.created_at)],
    ];

    return (
        <PublicLayout
            title={t('confirmacion.titulo_pagina', {
                nombre: encuentro.nombre,
            })}
        >
            <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
                <div className="text-center">
                    <CheckCircle2
                        className="mx-auto h-14 w-14 text-primary"
                        aria-hidden="true"
                    />
                    <h1 className="mt-3 font-serif text-3xl font-bold text-foreground">
                        {cancelada
                            ? t('confirmacion.cancelada')
                            : t('confirmacion.recibida')}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        {encuentro.nombre} ·{' '}
                        {formatRange(
                            encuentro.starts_on,
                            encuentro.ends_on,
                            locale,
                        )}
                    </p>
                </div>

                <div className="panel p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('confirmacion.tu_codigo')}
                    </p>
                    <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-primary">
                        {inscripcion.codigo}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                        {t('confirmacion.captura')}
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
                        <PanelTitle icon={Wallet}>{t('datos_pago')}</PanelTitle>
                        <p className="text-sm whitespace-pre-line text-foreground">
                            {encuentro.info_pago}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {t('confirmacion.info_pago_ayuda')}{' '}
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
                        <PanelTitle>{t('confirmacion.tus_pagos')}</PanelTitle>
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
                                        {fecha(p.fecha)}
                                        {p.metodo &&
                                            ` · ${t(`metodos.${p.metodo}`)}`}
                                    </span>
                                    <span
                                        className={cn(
                                            'ml-auto rounded px-2 py-0.5 text-xs font-medium',
                                            PAGO_REGISTRO_CLASSES[p.estado],
                                        )}
                                    >
                                        {t(`registro_estados.${p.estado}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {inscripcion.pagos.some(
                            (p) => p.estado === 'reportado',
                        ) && (
                            <p className="text-xs text-muted-foreground">
                                {t('confirmacion.por_revisar_ayuda')}
                            </p>
                        )}
                    </section>
                )}

                {!cancelada &&
                    inscripcion.saldo > 0 &&
                    encuentro.estado !== 'terminado' && (
                        <ReportarPago
                            url={`${encuentro.base}/inscripcion/${token}/pago`}
                            saldo={inscripcion.saldo}
                            metodos={metodos}
                        />
                    )}

                <section className="space-y-2 panel p-5">
                    <PanelTitle>
                        {t('confirmacion.volver_consultar')}
                    </PanelTitle>
                    <p className="text-sm text-muted-foreground">
                        {t('confirmacion.enlace_privado')}
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => void copiar()}
                    >
                        <Copy className="h-4 w-4" />
                        {copied
                            ? t('confirmacion.copiado')
                            : t('confirmacion.copiar')}
                    </Button>
                </section>

                <div className="text-center">
                    <Button asChild variant="ghost">
                        <Link href={encuentro.base || '/'}>
                            {t('confirmacion.volver_pagina')}
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
    const { t } = useT();
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
            <PanelTitle icon={Upload}>
                {t('confirmacion.mandar_titulo')}
            </PanelTitle>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <Label htmlFor="monto">{t('cuanto_pagaste')} *</Label>
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
                        <Label htmlFor="metodo">{t('como_pagaste')}</Label>
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
                                    {t(`metodos.${m}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="comprobante">{t('comprobante')} *</Label>
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
                    pendingLabel={t('enviando')}
                >
                    {t('confirmacion.mandar')}
                </SubmitButton>
            </form>
        </section>
    );
}
