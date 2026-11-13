import { Pencil, SearchX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import {
    CancionesBadge,
    EstadoBadge,
} from '@/components/portugues/palabra-detalle';
import { SearchInput } from '@/components/search-input';
import {
    coincide,
    estadoDe,
    ESTADOS,
    loteDe,
    tipoLabel,
    TIPOS,
} from '@/lib/portugues';
import type {
    EstadoPalabra,
    Palabra,
    Tarjeta,
    TipoPalabra,
} from '@/types/portugues';

const SELECT =
    'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground';

/**
 * Las 1000 palabras con el estado de cada una. Se filtra por lote, tipo,
 * estado o búsqueda (también por formas: "foi" encuentra "ser"). Desde acá
 * se puede trabajar cualquier palabra, no solo las del lote propuesto.
 */
export function ListaPalabras({
    palabras,
    tarjetas,
    loteTamano,
    totalLotes,
    lote,
    onLoteChange,
    onEditar,
}: {
    palabras: Palabra[];
    tarjetas: Record<string, Tarjeta>;
    loteTamano: number;
    totalLotes: number;
    /** Lote que se muestra (null: todos). */
    lote: number | null;
    onLoteChange: (lote: number | null) => void;
    onEditar: (palabra: Palabra) => void;
}) {
    const [busqueda, setBusqueda] = useState('');
    const [tipo, setTipo] = useState<TipoPalabra | ''>('');
    const [estado, setEstado] = useState<EstadoPalabra | ''>('');

    const visibles = useMemo(
        () =>
            palabras.filter(
                (p) =>
                    (lote === null ||
                        busqueda.trim() !== '' ||
                        loteDe(p.posicion, loteTamano) === lote) &&
                    (tipo === '' || p.tipo === tipo) &&
                    (estado === '' || estadoDe(tarjetas[p.id]) === estado) &&
                    coincide(p, busqueda),
            ),
        [palabras, tarjetas, lote, loteTamano, tipo, estado, busqueda],
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <SearchInput
                    value={busqueda}
                    onChange={setBusqueda}
                    label="Buscar palabra"
                    placeholder="Buscar en portugués o español…"
                    className="sm:max-w-xs sm:flex-1"
                />
                <select
                    aria-label="Lote"
                    value={lote ?? ''}
                    onChange={(e) =>
                        onLoteChange(
                            e.target.value === ''
                                ? null
                                : Number(e.target.value),
                        )
                    }
                    className={SELECT}
                >
                    <option value="">Todos los lotes</option>
                    {Array.from({ length: totalLotes }, (_, i) => i + 1).map(
                        (n) => (
                            <option key={n} value={n}>
                                Lote {n} ({(n - 1) * loteTamano + 1}–
                                {n * loteTamano})
                            </option>
                        ),
                    )}
                </select>
                <select
                    aria-label="Tipo de palabra"
                    value={tipo}
                    onChange={(e) =>
                        setTipo(e.target.value as TipoPalabra | '')
                    }
                    className={SELECT}
                >
                    <option value="">Todos los tipos</option>
                    {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select
                    aria-label="Estado"
                    value={estado}
                    onChange={(e) =>
                        setEstado(e.target.value as EstadoPalabra | '')
                    }
                    className={SELECT}
                >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map((e) => (
                        <option key={e.value} value={e.value}>
                            {e.label}
                        </option>
                    ))}
                </select>
            </div>

            {busqueda.trim() !== '' && lote !== null && (
                <p className="text-xs text-muted-foreground">
                    La búsqueda recorre los 50 lotes.
                </p>
            )}

            {visibles.length === 0 ? (
                <EmptyState icon={SearchX}>
                    Ninguna palabra coincide con los filtros.
                </EmptyState>
            ) : (
                <ul className="divide-y divide-border panel">
                    {visibles.map((p) => {
                        const t = tarjetas[p.id];

                        return (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => onEditar(p)}
                                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                                >
                                    <span className="w-10 shrink-0 pt-0.5 text-xs text-muted-foreground">
                                        {p.posicion}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                            <span className="font-serif font-bold text-foreground">
                                                {p.palabra}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {p.traduccion}
                                            </span>
                                        </div>
                                        {(t?.asociacion || t?.frase) && (
                                            <p className="mt-0.5 line-clamp-2 text-sm text-primary/90">
                                                {t.asociacion || t.frase}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span>{tipoLabel(p.tipo)}</span>
                                            <CancionesBadge
                                                canciones={p.canciones}
                                            />
                                            {t?.saltada && <span>Saltada</span>}
                                        </div>
                                    </div>
                                    <EstadoBadge tarjeta={t} />
                                    <Pencil
                                        aria-hidden="true"
                                        className="mt-0.5 hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
                                    />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}

            <p className="text-xs text-muted-foreground">
                Orden por frecuencia: lista{' '}
                <a
                    href="https://github.com/hermitdave/FrequencyWords"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-foreground"
                >
                    FrequencyWords
                </a>{' '}
                de Hermit Dave (subtítulos de OpenSubtitles, licencia CC BY-SA
                4.0), sumando las formas de cada palabra. Las traducciones y los
                ejemplos los está revisando el grupo.
            </p>
        </div>
    );
}
