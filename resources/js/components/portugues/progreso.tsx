import { Check } from 'lucide-react';
import { useState } from 'react';
import { SectionTitle } from '@/components/headings';
import { Button } from '@/components/ui/button';
import { enviar, estadoDe, loteDe, tieneAsociacion } from '@/lib/portugues';
import { cn } from '@/lib/utils';
import type { Palabra, Tarjeta } from '@/types/portugues';

export interface Resumen {
    aprendidas: number;
    conAsociacion: number;
    paraHoy: number;
    lote: number | null;
}

/** Cifras grandes: aprendidas, con asociación, lote en que va y repaso de hoy. */
export function ResumenCifras({
    resumen,
    total,
    totalLotes,
}: {
    resumen: Resumen;
    total: number;
    totalLotes: number;
}) {
    const cifras = [
        { valor: resumen.aprendidas, de: total, label: 'aprendidas' },
        { valor: resumen.conAsociacion, de: total, label: 'con asociación' },
        {
            valor: resumen.lote ?? totalLotes,
            de: totalLotes,
            label: resumen.lote ? 'lote en que vas' : 'lotes avanzados',
        },
        { valor: resumen.paraHoy, label: 'para repasar hoy' },
    ];

    return (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cifras.map((c) => (
                <div key={c.label} className="panel px-4 py-3">
                    <dt className="text-xs text-muted-foreground">{c.label}</dt>
                    <dd className="font-serif text-2xl font-bold text-foreground">
                        {c.valor}
                        {c.de !== undefined && (
                            <span className="text-base font-normal text-muted-foreground">
                                {' '}
                                / {c.de}
                            </span>
                        )}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * Los 50 lotes: cuántas palabras tiene trabajadas y aprendidas cada uno, y
 * marcarlo como avanzado (o deshacerlo).
 */
export function Progreso({
    palabras,
    tarjetas,
    loteTamano,
    totalLotes,
    lotesAvanzados,
    onVerLote,
}: {
    palabras: Palabra[];
    tarjetas: Record<string, Tarjeta>;
    loteTamano: number;
    totalLotes: number;
    lotesAvanzados: number[];
    onVerLote: (lote: number) => void;
}) {
    const [busy, setBusy] = useState(false);
    const lotes = Array.from({ length: totalLotes }, (_, i) => {
        const n = i + 1;
        const delLote = palabras.filter(
            (p) => loteDe(p.posicion, loteTamano) === n,
        );

        return {
            n,
            total: delLote.length,
            conAsociacion: delLote.filter((p) =>
                tieneAsociacion(tarjetas[p.id]),
            ).length,
            aprendidas: delLote.filter(
                (p) => estadoDe(tarjetas[p.id]) === 'aprendida',
            ).length,
            avanzado: lotesAvanzados.includes(n),
        };
    });

    const cambiar = (lote: number, avanzado: boolean) => {
        setBusy(true);
        enviar(
            avanzado ? 'delete' : 'post',
            `/portugues/lotes/${lote}`,
            {},
            {
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div>
            <SectionTitle subtitle="Cada lote tiene 20 palabras, por orden de frecuencia. La barra dorada son las aprendidas y la clara, las que tienen asociación.">
                Lotes
            </SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lotes.map((l) => (
                    <li
                        key={l.n}
                        className={cn(
                            'panel p-4',
                            l.avanzado && 'border-primary/60',
                        )}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-1.5 font-medium">
                                {l.avanzado && (
                                    <Check
                                        aria-label="Avanzado"
                                        className="h-4 w-4 text-primary"
                                    />
                                )}
                                Lote {l.n}
                                <span className="text-xs font-normal text-muted-foreground">
                                    ({(l.n - 1) * loteTamano + 1}–
                                    {(l.n - 1) * loteTamano + l.total})
                                </span>
                            </p>
                            <span className="text-xs text-muted-foreground">
                                {l.aprendidas} aprendidas
                            </span>
                        </div>
                        <div
                            className="relative mt-3 h-2 overflow-hidden rounded-full bg-muted"
                            role="img"
                            aria-label={`${l.conAsociacion} de ${l.total} con asociación, ${l.aprendidas} aprendidas`}
                        >
                            <div
                                className="absolute inset-y-0 left-0 bg-primary/35"
                                style={{
                                    width: `${(l.conAsociacion / l.total) * 100}%`,
                                }}
                            />
                            <div
                                className="absolute inset-y-0 left-0 bg-primary"
                                style={{
                                    width: `${(l.aprendidas / l.total) * 100}%`,
                                }}
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onVerLote(l.n)}
                            >
                                Ver palabras
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={busy}
                                onClick={() => cambiar(l.n, l.avanzado)}
                            >
                                {l.avanzado
                                    ? 'Quitar de avanzados'
                                    : 'Marcar como avanzado'}
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
