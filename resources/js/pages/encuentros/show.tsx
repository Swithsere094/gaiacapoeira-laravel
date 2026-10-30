import { Link, router } from '@inertiajs/react';
import {
    Download,
    ExternalLink,
    Eye,
    Lock,
    LockOpen,
    Pencil,
    Send,
    Ticket,
    Trash2,
    Undo2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { InscripcionDialog } from '@/components/encuentros/inscripcion-dialog';
import { FlashMessage } from '@/components/flash-message';
import { SectionTitle } from '@/components/headings';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import {
    ESTADO_CLASSES,
    ESTADO_LABELS,
    formatMoney,
    formatRange,
    PAGO_CLASSES,
    PAGO_LABELS,
} from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { Encuentro, InscripcionRow, PagoEstado } from '@/types/encuentros';

interface Resumen {
    inscritos: number;
    pagados: number;
    parciales: number;
    pendientes: number;
    recaudado: number;
    esperado: number;
}

type Filtro = 'todas' | PagoEstado | 'canceladas';

/** Un encuentro: publicarlo y gestionar sus inscripciones. */
export default function EncuentroShowPage({
    encuentro,
    inscripciones,
    resumen,
}: {
    encuentro: Encuentro;
    inscripciones: InscripcionRow[];
    resumen: Resumen;
}) {
    const { confirm } = useConfirm();
    const [query, setQuery] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('todas');
    const [selected, setSelected] = useState<InscripcionRow | null>(null);
    const [dialogKey, setDialogKey] = useState(0);
    const publicado = encuentro.estado !== 'borrador';

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return inscripciones.filter((i) => {
            if (filtro === 'canceladas' && i.estado !== 'cancelada')
                return false;
            if (filtro !== 'canceladas' && filtro !== 'todas') {
                if (i.estado !== 'activa' || i.pago_estado !== filtro)
                    return false;
            }
            if (!q) return true;
            return [i.nombre, i.apelido, i.grupo, i.codigo, i.telefono]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(q));
        });
    }, [inscripciones, query, filtro]);

    const post = (path: string) =>
        router.post(
            `/encuentros/${encuentro.id}/${path}`,
            {},
            { preserveScroll: true },
        );

    const publicar = async () => {
        const primeraVez = encuentro.subdominio !== 'creado';
        const ok = await confirm({
            title: `¿Publicar «${encuentro.nombre}»?`,
            description: primeraVez
                ? `Se crea la dirección ${encuentro.url} y la página queda visible para cualquiera con el enlace. La dirección puede tardar unos minutos en funcionar.`
                : 'La página vuelve a estar visible y se abren las inscripciones.',
            confirmLabel: 'Publicar',
        });
        if (ok) post('publicar');
    };

    const despublicar = async () => {
        const ok = await confirm({
            title: '¿Volver a borrador?',
            description:
                'La página deja de verse y sale del calendario. La dirección se conserva para cuando vuelvas a publicar.',
            confirmLabel: 'Volver a borrador',
        });
        if (ok) post('despublicar');
    };

    const eliminar = async () => {
        const ok = await confirm({
            title: `¿Eliminar «${encuentro.nombre}»?`,
            description:
                encuentro.subdominio === 'creado'
                    ? `Se borra el encuentro y la dirección ${encuentro.url}. No se puede deshacer.`
                    : 'Se borra el encuentro. No se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (ok) router.delete(`/encuentros/${encuentro.id}`);
    };

    const openInscripcion = (i: InscripcionRow) => {
        setSelected(i);
        setDialogKey((k) => k + 1);
    };

    const filtros: [Filtro, string, number][] = [
        ['todas', 'Todas', inscripciones.length],
        ['pendiente', 'Pendientes', resumen.pendientes],
        ['parcial', 'Parciales', resumen.parciales],
        ['pagado', 'Pagadas', resumen.pagados],
        ['canceladas', 'Canceladas', inscripciones.length - resumen.inscritos],
    ];

    return (
        <PageLayout
            title={encuentro.nombre}
            width="wide"
            className="space-y-8"
            header={
                <PageHeader
                    icon={Ticket}
                    title={encuentro.nombre}
                    description={formatRange(
                        encuentro.starts_on,
                        encuentro.ends_on,
                    )}
                    actions={
                        <Button asChild variant="outline" className="gap-2">
                            <Link href={`/encuentros/${encuentro.id}/editar`}>
                                <Pencil className="h-4 w-4" />
                                Editar
                            </Link>
                        </Button>
                    }
                />
            }
        >
            <FlashMessage />

            {/* Estado y publicación */}
            <section className="space-y-4 panel p-5">
                <div className="flex flex-wrap items-center gap-3">
                    <span
                        className={cn(
                            'rounded px-2 py-0.5 text-sm font-medium',
                            ESTADO_CLASSES[encuentro.estado],
                        )}
                    >
                        {ESTADO_LABELS[encuentro.estado]}
                    </span>
                    {encuentro.subdominio === 'creado' ? (
                        <a
                            href={encuentro.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-sm break-all text-primary hover:underline"
                        >
                            {encuentro.url.replace('https://', '')}
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            La dirección se crea al publicar.
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a
                            href={encuentro.respaldo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Eye className="h-4 w-4" />
                            {publicado ? 'Ver la página' : 'Vista previa'}
                        </a>
                    </Button>
                    {!publicado ? (
                        <Button
                            className="gap-2"
                            onClick={() => void publicar()}
                        >
                            <Send className="h-4 w-4" />
                            Publicar
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => post('inscripciones-abiertas')}
                            >
                                {encuentro.estado === 'publicado' ? (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Cerrar inscripciones
                                    </>
                                ) : (
                                    <>
                                        <LockOpen className="h-4 w-4" />
                                        Reabrir inscripciones
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                className="gap-2"
                                onClick={() => void despublicar()}
                            >
                                <Undo2 className="h-4 w-4" />
                                Volver a borrador
                            </Button>
                        </>
                    )}
                    {inscripciones.length === 0 && (
                        <Button
                            variant="ghost"
                            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void eliminar()}
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </Button>
                    )}
                </div>
            </section>

            {/* Resumen */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    [
                        'Inscritos',
                        encuentro.cupo
                            ? `${resumen.inscritos} / ${encuentro.cupo}`
                            : `${resumen.inscritos}`,
                    ],
                    ['Pagados', `${resumen.pagados}`],
                    ['Recaudado', formatMoney(resumen.recaudado)],
                    [
                        'Por cobrar',
                        formatMoney(
                            Math.max(0, resumen.esperado - resumen.recaudado),
                        ),
                    ],
                ].map(([label, value]) => (
                    <div key={label} className="panel p-4">
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-1 font-serif text-2xl font-bold text-foreground">
                            {value}
                        </p>
                    </div>
                ))}
            </section>

            {/* Inscripciones */}
            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <SectionTitle icon={Users} className="mb-0">
                        Inscripciones
                    </SectionTitle>
                    {inscripciones.length > 0 && (
                        <Button asChild variant="outline" className="gap-2">
                            <a href={`/encuentros/${encuentro.id}/exportar`}>
                                <Download className="h-4 w-4" />
                                Exportar a Excel
                            </a>
                        </Button>
                    )}
                </div>

                {inscripciones.length === 0 ? (
                    <EmptyState icon={Users}>
                        Todavía no hay inscripciones.
                        {!publicado && ' Publica el encuentro para recibirlas.'}
                    </EmptyState>
                ) : (
                    <>
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <SearchInput
                                value={query}
                                onChange={setQuery}
                                label="Buscar inscripción"
                                placeholder="Nombre, apelido, grupo, código o teléfono"
                                className="flex-1"
                            />
                        </div>
                        <div
                            className="mb-4 flex flex-wrap gap-2"
                            role="group"
                            aria-label="Filtrar por pago"
                        >
                            {filtros.map(([f, label, n]) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setFiltro(f)}
                                    aria-pressed={filtro === f}
                                    className={cn(
                                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                                        filtro === f
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
                                    )}
                                >
                                    {label} ({n})
                                </button>
                            ))}
                        </div>

                        {shown.length === 0 ? (
                            <EmptyState>
                                No hay inscripciones con ese filtro.
                            </EmptyState>
                        ) : (
                            <ul className="divide-y divide-border panel">
                                {shown.map((i) => (
                                    <li key={i.id}>
                                        <button
                                            type="button"
                                            onClick={() => openInscripcion(i)}
                                            className={cn(
                                                'flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left transition-colors hover:bg-secondary/50',
                                                i.estado === 'cancelada' &&
                                                    'opacity-60',
                                            )}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-foreground">
                                                    {i.nombre}
                                                    {i.apelido && (
                                                        <span className="font-normal text-muted-foreground italic">
                                                            {' '}
                                                            «{i.apelido}»
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {i.grupo} ·{' '}
                                                    {i.precio_nombre} ·{' '}
                                                    <span className="font-mono">
                                                        {i.codigo}
                                                    </span>
                                                </p>
                                            </div>
                                            {i.estado === 'cancelada' ? (
                                                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                    Cancelada
                                                </span>
                                            ) : (
                                                <span
                                                    className={cn(
                                                        'rounded px-2 py-0.5 text-xs font-medium',
                                                        PAGO_CLASSES[
                                                            i.pago_estado
                                                        ],
                                                    )}
                                                >
                                                    {PAGO_LABELS[i.pago_estado]}
                                                    {i.pago_estado ===
                                                        'parcial' &&
                                                        ` · ${formatMoney(i.monto_pagado)}`}
                                                </span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </section>

            <InscripcionDialog
                key={dialogKey}
                encuentroId={encuentro.id}
                inscripcion={selected}
                open={selected !== null}
                onOpenChange={(open) => !open && setSelected(null)}
            />
        </PageLayout>
    );
}
