import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, ClipboardCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { SearchInput } from '@/components/search-input';
import { formatMoney } from '@/lib/encuentros';
import { cn } from '@/lib/utils';

interface Asistente {
    id: string;
    codigo: string;
    nombre: string;
    apelido: string | null;
    grupo: string;
    precio_nombre: string;
    talla: string | null;
    saldo: number;
    asistio: boolean;
}

/**
 * Asistencia el día del encuentro, pensada para el celular: buscar a la
 * persona (nombre, apelido, grupo o código) y tocar para marcar que llegó.
 * Muestra si todavía debe plata, para cobrarle en la entrada.
 */
export default function AsistenciaPage({
    encuentro,
    inscripciones,
}: {
    encuentro: { id: string; nombre: string };
    inscripciones: Asistente[];
}) {
    const [query, setQuery] = useState('');
    const [soloFaltan, setSoloFaltan] = useState(false);
    const llegaron = inscripciones.filter((i) => i.asistio).length;

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        return inscripciones.filter(
            (i) =>
                (!soloFaltan || !i.asistio) &&
                (!q ||
                    [i.nombre, i.apelido, i.grupo, i.codigo]
                        .filter(Boolean)
                        .some((v) => v!.toLowerCase().includes(q))),
        );
    }, [inscripciones, query, soloFaltan]);

    const toggle = (i: Asistente) =>
        router.post(
            `/encuentros/${encuentro.id}/inscripciones/${i.id}/asistencia`,
            {},
            { preserveScroll: true, preserveState: true },
        );

    return (
        <PageLayout
            title={`Asistencia · ${encuentro.nombre}`}
            width="narrow"
            className="space-y-4"
            header={
                <PageHeader
                    icon={ClipboardCheck}
                    title="Asistencia"
                    description={`${encuentro.nombre} · llegaron ${llegaron} de ${inscripciones.length}`}
                />
            }
        >
            <Link
                href={`/encuentros/${encuentro.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al encuentro
            </Link>

            <SearchInput
                value={query}
                onChange={setQuery}
                label="Buscar persona"
                placeholder="Nombre, apelido, grupo o código"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                    type="checkbox"
                    checked={soloFaltan}
                    onChange={(e) => setSoloFaltan(e.target.checked)}
                    className="h-4 w-4 accent-[var(--primary)]"
                />
                Mostrar solo quienes no han llegado
            </label>

            {shown.length === 0 ? (
                <EmptyState icon={ClipboardCheck}>
                    {inscripciones.length === 0
                        ? 'No hay inscripciones activas.'
                        : 'Nadie coincide con la búsqueda.'}
                </EmptyState>
            ) : (
                <ul className="space-y-2">
                    {shown.map((i) => (
                        <li key={i.id}>
                            <button
                                type="button"
                                onClick={() => toggle(i)}
                                aria-pressed={i.asistio}
                                className={cn(
                                    'flex w-full items-center gap-3 panel p-4 text-left transition-colors',
                                    i.asistio
                                        ? 'border-primary/60 bg-primary/10'
                                        : 'hover:border-primary/40',
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2',
                                        i.asistio
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-muted-foreground/50',
                                    )}
                                >
                                    {i.asistio && <Check className="h-5 w-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium text-foreground">
                                        {i.nombre}
                                        {i.apelido && (
                                            <span className="font-normal text-muted-foreground italic">
                                                {' '}
                                                «{i.apelido}»
                                            </span>
                                        )}
                                    </span>
                                    <span className="block truncate text-sm text-muted-foreground">
                                        {i.grupo} · {i.precio_nombre}
                                        {i.talla &&
                                            ` · talla ${i.talla}`} ·{' '}
                                        <span className="font-mono">
                                            {i.codigo}
                                        </span>
                                    </span>
                                </span>
                                {i.saldo > 0 && (
                                    <span className="shrink-0 rounded bg-destructive/15 px-2 py-0.5 text-xs font-medium text-foreground">
                                        Debe {formatMoney(i.saldo)}
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </PageLayout>
    );
}
