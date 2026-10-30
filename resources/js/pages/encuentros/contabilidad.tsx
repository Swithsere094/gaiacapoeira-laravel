import { router } from '@inertiajs/react';
import {
    Download,
    Minus,
    Paperclip,
    Pencil,
    Plus,
    Receipt,
    Ticket,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { EncuentroTabs } from '@/components/encuentros/encuentro-tabs';
import { MovimientoFormDialog } from '@/components/encuentros/movimiento-form-dialog';
import { FlashMessage } from '@/components/flash-message';
import { PanelTitle, SectionTitle } from '@/components/headings';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/dates';
import { formatMoney, formatRange } from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { Movimiento } from '@/types/encuentros';

interface Resumen {
    inscripciones: number;
    pagos_count: number;
    otros_ingresos: number;
    gastos: number;
    balance: number;
    por_cobrar: number;
    por_revisar: number;
    gastos_por_categoria: { categoria: string; total: number }[];
    por_metodo: {
        metodo: string;
        ingresos: number;
        gastos: number;
        neto: number;
    }[];
}

type Filtro = 'todos' | Movimiento['tipo'];

/**
 * Contabilidad de un encuentro: los pagos confirmados de las inscripciones
 * entran solos; acá se anotan los gastos y otros ingresos, y se ve el
 * balance.
 */
export default function ContabilidadPage({
    encuentro,
    movimientos,
    resumen,
    categorias,
    metodos,
    hoy,
}: {
    encuentro: {
        id: string;
        nombre: string;
        starts_on: string;
        ends_on: string | null;
    };
    movimientos: Movimiento[];
    resumen: Resumen;
    categorias: Record<Movimiento['tipo'], string[]>;
    metodos: string[];
    hoy: string;
}) {
    const { confirm } = useConfirm();
    const [filtro, setFiltro] = useState<Filtro>('todos');
    const [dialog, setDialog] = useState<{
        tipo: Movimiento['tipo'];
        movimiento: Movimiento | null;
    } | null>(null);
    const [dialogKey, setDialogKey] = useState(0);

    const abrir = (tipo: Movimiento['tipo'], movimiento: Movimiento | null) => {
        setDialog({ tipo, movimiento });
        setDialogKey((k) => k + 1);
    };

    const eliminar = async (m: Movimiento) => {
        const ok = await confirm({
            title: `¿Eliminar «${m.concepto}»?`,
            description: `${m.tipo === 'gasto' ? 'Gasto' : 'Ingreso'} de ${formatMoney(m.monto)} del ${formatDate(m.fecha)}. Se borra también su comprobante.`,
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (ok) {
            router.delete(`/encuentros/${encuentro.id}/movimientos/${m.id}`, {
                preserveScroll: true,
            });
        }
    };

    const ingresos = resumen.inscripciones + resumen.otros_ingresos;
    const shown = movimientos.filter(
        (m) => filtro === 'todos' || m.tipo === filtro,
    );
    const maxCategoria = Math.max(
        1,
        ...resumen.gastos_por_categoria.map((c) => c.total),
    );

    return (
        <PageLayout
            title={`Contabilidad · ${encuentro.nombre}`}
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
                />
            }
            tabs={
                <EncuentroTabs
                    encuentroId={encuentro.id}
                    activa="contabilidad"
                />
            }
        >
            <FlashMessage />

            {/* Resumen */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Tarjeta
                    label="Ingresos"
                    valor={formatMoney(ingresos)}
                    detalle={`Inscripciones ${formatMoney(resumen.inscripciones)} · otros ${formatMoney(resumen.otros_ingresos)}`}
                />
                <Tarjeta label="Gastos" valor={formatMoney(resumen.gastos)} />
                <Tarjeta
                    label="Balance"
                    valor={formatMoney(resumen.balance)}
                    tono={resumen.balance < 0 ? 'negativo' : 'positivo'}
                />
                <Tarjeta
                    label="Por cobrar"
                    valor={formatMoney(resumen.por_cobrar)}
                    detalle={
                        resumen.por_revisar > 0
                            ? `${formatMoney(resumen.por_revisar)} reportados sin confirmar`
                            : 'Saldo de las inscripciones activas'
                    }
                />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="space-y-3 panel p-5">
                    <PanelTitle>Gastos por categoría</PanelTitle>
                    {resumen.gastos_por_categoria.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay gastos anotados.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {resumen.gastos_por_categoria.map((c) => (
                                <li key={c.categoria} className="text-sm">
                                    <div className="flex justify-between gap-2">
                                        <span className="text-foreground">
                                            {c.categoria}
                                        </span>
                                        <span className="font-medium text-foreground tabular-nums">
                                            {formatMoney(c.total)}
                                        </span>
                                    </div>
                                    <div
                                        className="mt-1 h-1.5 rounded-full bg-secondary"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{
                                                width: `${(c.total / maxCategoria) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="space-y-3 panel p-5">
                    <PanelTitle>Por método de pago</PanelTitle>
                    {resumen.por_metodo.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay movimientos.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground">
                                    <th className="pb-2 font-normal">Método</th>
                                    <th className="pb-2 text-right font-normal">
                                        Entró
                                    </th>
                                    <th className="pb-2 text-right font-normal">
                                        Salió
                                    </th>
                                    <th className="pb-2 text-right font-normal">
                                        Queda
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="tabular-nums">
                                {resumen.por_metodo.map((m) => (
                                    <tr
                                        key={m.metodo}
                                        className="border-t border-border"
                                    >
                                        <td className="py-2 text-foreground">
                                            {m.metodo}
                                        </td>
                                        <td className="py-2 text-right">
                                            {formatMoney(m.ingresos)}
                                        </td>
                                        <td className="py-2 text-right">
                                            {formatMoney(m.gastos)}
                                        </td>
                                        <td
                                            className={cn(
                                                'py-2 text-right font-medium',
                                                m.neto < 0
                                                    ? 'text-destructive'
                                                    : 'text-foreground',
                                            )}
                                        >
                                            {formatMoney(m.neto)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>

            {/* Movimientos */}
            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <SectionTitle icon={Receipt} className="mb-0">
                        Movimientos
                    </SectionTitle>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="gap-2"
                            onClick={() => abrir('gasto', null)}
                        >
                            <Minus className="h-4 w-4" />
                            Nuevo gasto
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => abrir('ingreso', null)}
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo ingreso
                        </Button>
                        <Button asChild variant="outline" className="gap-2">
                            <a
                                href={`/encuentros/${encuentro.id}/contabilidad/exportar`}
                            >
                                <Download className="h-4 w-4" />
                                Exportar a Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                    {(
                        [
                            ['todos', 'Todos'],
                            ['gasto', 'Gastos'],
                            ['ingreso', 'Otros ingresos'],
                        ] as [Filtro, string][]
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFiltro(key)}
                            aria-pressed={filtro === key}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-sm transition-colors',
                                filtro === key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <ul className="divide-y divide-border panel">
                    {filtro !== 'gasto' && resumen.pagos_count > 0 && (
                        <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                            <span className="text-foreground">
                                Pagos de inscripciones confirmados (
                                {resumen.pagos_count})
                            </span>
                            <span className="text-muted-foreground">
                                Se suman solos · el detalle está en
                                Inscripciones
                            </span>
                            <span className="ml-auto font-medium text-foreground tabular-nums">
                                +{formatMoney(resumen.inscripciones)}
                            </span>
                        </li>
                    )}
                    {shown.map((m) => (
                        <li
                            key={m.id}
                            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground">
                                    {m.concepto}
                                    {m.comprobante && (
                                        <a
                                            href={m.comprobante}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="Ver comprobante"
                                            aria-label={`Ver comprobante de ${m.concepto}`}
                                            className="ml-2 inline-flex align-middle text-primary"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </a>
                                    )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {formatDate(m.fecha)} · {m.categoria}
                                    {m.metodo && ` · ${m.metodo}`}
                                    {m.nota && ` · ${m.nota}`}
                                </p>
                            </div>
                            <span
                                className={cn(
                                    'font-medium tabular-nums',
                                    m.tipo === 'gasto'
                                        ? 'text-destructive'
                                        : 'text-foreground',
                                )}
                            >
                                {m.tipo === 'gasto' ? '−' : '+'}
                                {formatMoney(m.monto)}
                            </span>
                            <div className="flex gap-1">
                                <IconButton
                                    icon={Pencil}
                                    label={`Editar «${m.concepto}»`}
                                    onClick={() => abrir(m.tipo, m)}
                                />
                                <IconButton
                                    icon={Trash2}
                                    label={`Eliminar «${m.concepto}»`}
                                    tone="destructive"
                                    onClick={() => void eliminar(m)}
                                />
                            </div>
                        </li>
                    ))}
                    {shown.length === 0 &&
                        !(filtro !== 'gasto' && resumen.pagos_count > 0) && (
                            <li>
                                <EmptyState icon={Receipt}>
                                    Todavía no hay movimientos anotados.
                                </EmptyState>
                            </li>
                        )}
                </ul>
            </section>

            {dialog && (
                <MovimientoFormDialog
                    key={dialogKey}
                    open
                    onOpenChange={(open) => !open && setDialog(null)}
                    encuentroId={encuentro.id}
                    tipo={dialog.tipo}
                    movimiento={dialog.movimiento}
                    categorias={categorias[dialog.tipo]}
                    metodos={metodos}
                    hoy={hoy}
                />
            )}
        </PageLayout>
    );
}

function Tarjeta({
    label,
    valor,
    detalle,
    tono,
}: {
    label: string;
    valor: string;
    detalle?: string;
    tono?: 'positivo' | 'negativo';
}) {
    return (
        <div className="panel p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-1 font-serif text-2xl font-bold',
                    tono === 'negativo'
                        ? 'text-destructive'
                        : tono === 'positivo'
                          ? 'text-primary'
                          : 'text-foreground',
                )}
            >
                {valor}
            </p>
            {detalle && (
                <p className="mt-1 text-xs text-muted-foreground">{detalle}</p>
            )}
        </div>
    );
}
