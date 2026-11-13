import { CheckCircle2, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { CancionesBadge } from '@/components/portugues/palabra-detalle';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    enviar,
    loteDe,
    paraHoy,
    tieneAsociacion,
    tipoLabel,
    TIPOS,
} from '@/lib/portugues';
import type {
    NotaRepaso,
    Palabra,
    Tarjeta,
    TipoPalabra,
} from '@/types/portugues';

/** 'hoy' | 'todas' | 'lote:3' | 'tipo:verbo' */
export type Mazo = string;

/** Calificaciones: a cuántas tarjetas de distancia vuelve en la sesión (0 = no vuelve). */
const NOTAS: {
    value: NotaRepaso;
    label: string;
    detalle: string;
    vuelve: number;
}[] = [
    {
        value: 'otra_vez',
        label: 'Otra vez',
        detalle: 'no me acordé',
        vuelve: 3,
    },
    { value: 'dificil', label: 'Difícil', detalle: 'me costó', vuelve: 7 },
    { value: 'bien', label: 'Bien', detalle: 'la sé', vuelve: 0 },
    { value: 'facil', label: 'Fácil', detalle: 'muy fácil', vuelve: 0 },
];

/**
 * Flashcards estilo Anki: se elige el mazo (para repasar hoy, un lote, un
 * tipo o todas) y la dirección. Por defecto entran solo las palabras con
 * asociación. Cada calificación se guarda y decide cuándo vuelve la
 * tarjeta en los próximos días (App\Support\Repaso); "Otra vez" y "Difícil"
 * además la repiten en la misma sesión.
 */
export function Flashcards({
    palabras,
    tarjetas,
    hoy,
    loteTamano,
    totalLotes,
    mazoInicial,
}: {
    palabras: Palabra[];
    tarjetas: Record<string, Tarjeta>;
    hoy: string;
    loteTamano: number;
    totalLotes: number;
    mazoInicial: Mazo;
}) {
    const [mazo, setMazo] = useState<Mazo>(mazoInicial);
    const [incluirSin, setIncluirSin] = useState(false);
    const [invertir, setInvertir] = useState(false);

    const armar = (m: Mazo, incluir: boolean): string[] => {
        const base = palabras.filter((p) => {
            const t = tarjetas[p.id];

            if (!incluir && !tieneAsociacion(t)) {
                return false;
            }

            if (m === 'hoy') {
                return paraHoy(t, hoy);
            }

            if (m.startsWith('lote:')) {
                return loteDe(p.posicion, loteTamano) === Number(m.slice(5));
            }

            if (m.startsWith('tipo:')) {
                return p.tipo === (m.slice(5) as TipoPalabra);
            }

            return true;
        });

        return mezclar(base.map((p) => p.id));
    };

    const [cola, setCola] = useState<string[]>(() => armar(mazoInicial, false));
    const [total, setTotal] = useState(cola.length);
    const [volteada, setVolteada] = useState(false);

    const empezar = (m: Mazo, incluir: boolean) => {
        const nueva = armar(m, incluir);
        setCola(nueva);
        setTotal(nueva.length);
        setVolteada(false);
    };

    const porId = (id: string) => palabras.find((p) => p.id === id);
    const actual = cola[0] ? porId(cola[0]) : undefined;

    const calificar = (nota: (typeof NOTAS)[number]) => {
        if (!actual) {
            return;
        }

        enviar('post', `/portugues/palabras/${actual.id}/repaso`, {
            nota: nota.value,
        });
        setCola((c) => {
            const resto = c.slice(1);

            if (nota.vuelve > 0) {
                resto.splice(Math.min(nota.vuelve, resto.length), 0, c[0]);
            }

            return resto;
        });
        setVolteada(false);
    };

    // Teclado: Espacio o Enter da vuelta la tarjeta; 1-4 califica.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const el = e.target as HTMLElement;

            if (
                !actual ||
                ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName)
            ) {
                return;
            }

            if (!volteada && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                setVolteada(true);
            } else if (volteada && ['1', '2', '3', '4'].includes(e.key)) {
                calificar(NOTAS[Number(e.key) - 1]);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    });

    const paraHoyCount = palabras.filter(
        (p) =>
            paraHoy(tarjetas[p.id], hoy) &&
            (incluirSin || tieneAsociacion(tarjetas[p.id])),
    ).length;

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <select
                    aria-label="Mazo"
                    value={mazo}
                    onChange={(e) => {
                        setMazo(e.target.value);
                        empezar(e.target.value, incluirSin);
                    }}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                    <option value="hoy">
                        Para repasar hoy ({paraHoyCount})
                    </option>
                    <option value="todas">Todas</option>
                    <optgroup label="Por tipo">
                        {TIPOS.map((t) => (
                            <option key={t.value} value={`tipo:${t.value}`}>
                                {t.label}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Por lote">
                        {Array.from(
                            { length: totalLotes },
                            (_, i) => i + 1,
                        ).map((n) => (
                            <option key={n} value={`lote:${n}`}>
                                Lote {n}
                            </option>
                        ))}
                    </optgroup>
                </select>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="fc-incluir"
                        checked={incluirSin}
                        onCheckedChange={(v) => {
                            setIncluirSin(v === true);
                            empezar(mazo, v === true);
                        }}
                    />
                    <Label htmlFor="fc-incluir" className="font-normal">
                        Incluir palabras sin asociación
                    </Label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="fc-invertir"
                        checked={invertir}
                        onCheckedChange={(v) => {
                            setInvertir(v === true);
                            setVolteada(false);
                        }}
                    />
                    <Label htmlFor="fc-invertir" className="font-normal">
                        Español → portugués
                    </Label>
                </div>
            </div>

            {total === 0 ? (
                <EmptyState icon={Layers}>
                    {mazo === 'hoy'
                        ? 'No tienes tarjetas para repasar hoy. ¡Vas al día! Crea asociaciones nuevas en «Hoy» o elige otro mazo.'
                        : incluirSin
                          ? 'Este mazo no tiene palabras.'
                          : 'No hay palabras con asociación en este mazo. Créalas en «Hoy» o en la lista, o incluye las que no tienen.'}
                </EmptyState>
            ) : !actual ? (
                <div className="space-y-4 panel p-8 text-center">
                    <CheckCircle2
                        aria-hidden="true"
                        className="mx-auto h-10 w-10 text-primary"
                    />
                    <p className="font-serif text-2xl font-bold">
                        ¡Listo! Repasaste {total}{' '}
                        {total === 1 ? 'tarjeta' : 'tarjetas'}.
                    </p>
                    <Button onClick={() => empezar(mazo, incluirSin)}>
                        Repasar de nuevo
                    </Button>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground">
                        Quedan {cola.length} de {total}
                    </p>
                    <Carta
                        palabra={actual}
                        tarjeta={tarjetas[actual.id]}
                        invertir={invertir}
                        volteada={volteada}
                        onVoltear={() => setVolteada(true)}
                    />
                    {volteada && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {NOTAS.map((n, i) => (
                                <button
                                    key={n.value}
                                    type="button"
                                    onClick={() => calificar(n)}
                                    className="rounded-lg border border-border bg-card px-2 py-3 text-sm font-medium transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none"
                                >
                                    {n.label}
                                    <span className="block text-xs font-normal text-muted-foreground">
                                        {n.detalle}
                                        <span className="hidden [@media(hover:hover)]:inline">
                                            {' '}
                                            · {i + 1}
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function Carta({
    palabra,
    tarjeta,
    invertir,
    volteada,
    onVoltear,
}: {
    palabra: Palabra;
    tarjeta: Tarjeta | undefined;
    invertir: boolean;
    volteada: boolean;
    onVoltear: () => void;
}) {
    const frente = invertir ? palabra.traduccion : palabra.palabra;
    const respuesta = invertir ? palabra.palabra : palabra.traduccion;
    // De frente es un botón (tocar = dar vuelta); con la respuesta, un bloque.
    const Contenedor = volteada ? 'div' : 'button';

    return (
        <Contenedor
            {...(volteada
                ? {}
                : {
                      type: 'button' as const,
                      onClick: onVoltear,
                      'aria-label': `${frente}. Toca para ver la respuesta`,
                  })}
            className="flex min-h-64 w-full flex-col items-center justify-center gap-3 panel p-6 text-center select-none focus-visible:border-primary focus-visible:outline-none"
        >
            <span className="text-xs tracking-wider text-muted-foreground uppercase">
                {volteada
                    ? frente
                    : `${invertir ? 'Español' : 'Portugués'} · ${tipoLabel(palabra.tipo)}`}
            </span>
            <span className="font-serif text-4xl font-bold break-words text-foreground">
                {volteada ? respuesta : frente}
            </span>
            {!volteada ? (
                <span className="text-sm text-muted-foreground">
                    Toca para ver la respuesta
                    <span className="hidden [@media(hover:hover)]:inline">
                        {' '}
                        (o pulsa Espacio)
                    </span>
                </span>
            ) : (
                <div className="space-y-2" aria-live="polite">
                    {tarjeta?.suena_como && (
                        <p className="text-sm text-muted-foreground">
                            Suena como: {tarjeta.suena_como}
                        </p>
                    )}
                    {tarjeta?.asociacion && (
                        <p className="text-lg text-primary">
                            {tarjeta.asociacion}
                        </p>
                    )}
                    {(tarjeta?.frase || palabra.ejemplo) && (
                        <p className="text-sm italic">
                            {tarjeta?.frase || palabra.ejemplo}
                            {!tarjeta?.frase && palabra.ejemplo_traduccion && (
                                <span className="text-muted-foreground not-italic">
                                    {' '}
                                    — {palabra.ejemplo_traduccion}
                                </span>
                            )}
                        </p>
                    )}
                    <CancionesBadge canciones={palabra.canciones} />
                </div>
            )}
        </Contenedor>
    );
}

function mezclar<T>(lista: T[]): T[] {
    const a = [...lista];

    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }

    return a;
}
