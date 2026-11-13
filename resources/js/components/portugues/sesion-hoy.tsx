import { CheckCircle2, ListChecks, SkipForward } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PanelTitle } from '@/components/headings';
import { AsociacionForm } from '@/components/portugues/asociacion-form';
import {
    CancionesBadge,
    PalabraCabecera,
} from '@/components/portugues/palabra-detalle';
import { Button } from '@/components/ui/button';
import { enviar, loteDe, tieneAsociacion } from '@/lib/portugues';
import { cn } from '@/lib/utils';
import type { Palabra, Tarjeta } from '@/types/portugues';

const CANTIDADES = [5, 10, 15, 20];

type Fase = 'elegir' | 'trabajar' | 'listo';

/**
 * La sesión del día: el sitio propone las palabras sin trabajar del lote en
 * que va la persona (por frecuencia), ella elige cuántas, puede saltar
 * alguna, y crea la asociación de cada una. Al final, marca el lote como
 * avanzado para pasar al siguiente.
 */
export function SesionHoy({
    palabras,
    tarjetas,
    lote,
    loteTamano,
    onElegirOtras,
    onRepasar,
}: {
    palabras: Palabra[];
    tarjetas: Record<string, Tarjeta>;
    /** Lote en que va (null: ya avanzó todos). */
    lote: number | null;
    loteTamano: number;
    onElegirOtras: (lote: number) => void;
    onRepasar: () => void;
}) {
    const [fase, setFase] = useState<Fase>('elegir');
    const [cantidad, setCantidad] = useState(5);
    const [seleccion, setSeleccion] = useState<Palabra[]>([]);
    const [indice, setIndice] = useState(0);
    const [hechas, setHechas] = useState(0);
    const [busy, setBusy] = useState(false);
    const arriba = useRef<HTMLDivElement>(null);

    // Cada palabra nueva (o el final) se ve desde arriba, bajo las pestañas.
    useEffect(() => {
        const el = arriba.current;

        if (el && el.getBoundingClientRect().top < 0) {
            window.scrollTo({
                top: window.scrollY + el.getBoundingClientRect().top - 140,
            });
        }
    }, [fase, indice]);

    if (lote === null) {
        return (
            <EmptyState icon={CheckCircle2}>
                ¡Avanzaste los 50 lotes! Sigue repasando con las flashcards.
            </EmptyState>
        );
    }

    const delLote = palabras.filter(
        (p) => loteDe(p.posicion, loteTamano) === lote,
    );
    const pendientes = delLote.filter((p) => {
        const t = tarjetas[p.id];

        return !tieneAsociacion(t) && t?.estado !== 'aprendida' && !t?.saltada;
    });
    const trabajadas = delLote.length - pendientes.length;
    const propuestas = pendientes.slice(0, cantidad);

    const saltar = (palabra: Palabra, onDone?: () => void) => {
        setBusy(true);
        enviar(
            'post',
            `/portugues/palabras/${palabra.id}/saltar`,
            {},
            {
                onSuccess: () => onDone?.(),
                onFinish: () => setBusy(false),
            },
        );
    };

    const avanzarLote = () => {
        setBusy(true);
        enviar(
            'post',
            `/portugues/lotes/${lote}`,
            {},
            {
                onSuccess: () => setFase('elegir'),
                onFinish: () => setBusy(false),
            },
        );
    };

    const siguiente = (guardada: boolean) => {
        if (guardada) {
            setHechas((n) => n + 1);
        }

        if (indice + 1 >= seleccion.length) {
            setFase('listo');
        } else {
            setIndice((i) => i + 1);
        }
    };

    if (fase === 'trabajar' && seleccion[indice]) {
        const palabra = seleccion[indice];

        return (
            <div ref={arriba} className="mx-auto max-w-2xl space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Palabra {indice + 1} de {seleccion.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFase('listo')}
                    >
                        Terminar por hoy
                    </Button>
                </div>
                <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                >
                    <div
                        className="h-full bg-primary transition-all"
                        style={{
                            width: `${(indice / seleccion.length) * 100}%`,
                        }}
                    />
                </div>
                <div className="space-y-5 panel p-5 sm:p-6">
                    <PalabraCabecera palabra={palabra} />
                    <AsociacionForm
                        key={palabra.id}
                        palabra={palabra}
                        tarjeta={tarjetas[palabra.id]}
                        submitLabel="Guardar y seguir"
                        onSaved={() => siguiente(true)}
                        actions={
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                    saltar(palabra, () => siguiente(false))
                                }
                            >
                                <SkipForward className="h-4 w-4" />
                                Saltar
                            </Button>
                        }
                    />
                </div>
            </div>
        );
    }

    if (fase === 'listo') {
        return (
            <div
                ref={arriba}
                className="mx-auto max-w-2xl space-y-4 panel p-6 text-center"
            >
                <CheckCircle2
                    aria-hidden="true"
                    className="mx-auto h-10 w-10 text-primary"
                />
                <p className="font-serif text-2xl font-bold">
                    {hechas === 0
                        ? 'Sesión terminada'
                        : hechas === 1
                          ? '¡Creaste 1 asociación!'
                          : `¡Creaste ${hechas} asociaciones!`}
                </p>
                <p className="text-muted-foreground">
                    Repásalas con las flashcards hoy y en los próximos días: el
                    sitio te las vuelve a mostrar cuando toca.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={onRepasar}>Repasar con flashcards</Button>
                    <Button variant="outline" onClick={() => setFase('elegir')}>
                        Trabajar más palabras
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-5 panel p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <PanelTitle icon={ListChecks}>
                            Lote {lote}: palabras {(lote - 1) * loteTamano + 1}{' '}
                            a {lote * loteTamano}
                        </PanelTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Llevas {trabajadas} de {delLote.length} trabajadas
                            en este lote.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onElegirOtras(lote)}
                    >
                        Elegir otras palabras
                    </Button>
                </div>

                {pendientes.length === 0 ? (
                    <p className="rounded-lg bg-muted/50 p-4 text-sm">
                        Ya trabajaste todas las palabras de este lote (o las
                        saltaste). Márcalo como avanzado para pasar al
                        siguiente.
                    </p>
                ) : (
                    <>
                        <fieldset>
                            <legend className="mb-2 text-sm font-medium">
                                ¿Cuántas palabras trabajas hoy?
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {CANTIDADES.map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        aria-pressed={cantidad === n}
                                        onClick={() => setCantidad(n)}
                                        className={cn(
                                            'h-10 min-w-12 rounded-md border px-3 text-sm font-medium transition-colors',
                                            cantidad === n
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border hover:border-primary',
                                        )}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <ul className="divide-y divide-border rounded-lg border border-border">
                            {propuestas.map((p) => (
                                <li
                                    key={p.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <span className="w-10 shrink-0 text-xs text-muted-foreground">
                                        {p.posicion}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <span className="font-serif font-bold">
                                            {p.palabra}
                                        </span>{' '}
                                        <span className="text-sm text-muted-foreground">
                                            {p.traduccion}
                                        </span>
                                        <div>
                                            <CancionesBadge
                                                canciones={p.canciones}
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={busy}
                                        onClick={() => saltar(p)}
                                        aria-label={`Saltar «${p.palabra}»`}
                                    >
                                        <SkipForward className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            Saltar
                                        </span>
                                    </Button>
                                </li>
                            ))}
                        </ul>

                        <Button
                            onClick={() => {
                                setSeleccion(propuestas);
                                setIndice(0);
                                setHechas(0);
                                setFase('trabajar');
                            }}
                        >
                            {propuestas.length === 1
                                ? 'Empezar con 1 palabra'
                                : `Empezar con ${propuestas.length} palabras`}
                        </Button>
                    </>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4">
                <p className="text-sm text-muted-foreground">
                    ¿Ya tienes este lote dominado? Pasa al siguiente. Las
                    palabras que te falten siguen en la lista.
                </p>
                <Button variant="outline" disabled={busy} onClick={avanzarLote}>
                    Marcar el lote {lote} como avanzado
                </Button>
            </div>
        </div>
    );
}
