import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    FastForward,
    Loader2,
    Pause,
    Play,
    Trophy,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { retoContext } from '@/components/retos/active-week-card';
import { FlashMessage } from '@/components/retos/flash-message';
import { Button } from '@/components/ui/button';
import { WEEK_DAYS, formatClock, formatMinutes, weekStatus } from '@/lib/retos';
import type {
    Paso,
    RetoResumen,
    RetosDemoState,
    SemanaActiva,
} from '@/lib/retos';
import { cn } from '@/lib/utils';

interface Session {
    id: string;
    started_at: string;
    /** Lo que exige el servidor (más corto con el cronómetro rápido). */
    duration_seconds: number;
}

interface Props {
    reto: RetoResumen & { steps: Paso[] };
    semana: SemanaActiva | null;
    session: Session | null;
    /** Hora del servidor al armar la página (para no depender del reloj del celular). */
    server_now: string;
    demo: RetosDemoState;
}

/** Pitido corto y vibración al cambiar de paso. */
function signal() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        osc.onended = () => void ctx.close();
    } catch {
        // Sin audio: no pasa nada.
    }

    navigator.vibrate?.(200);
}

/** Mantiene la pantalla encendida mientras `active` (si el navegador lo permite). */
function useWakeLock(active: boolean) {
    useEffect(() => {
        if (!active || !('wakeLock' in navigator)) {
            return;
        }

        let lock: WakeLockSentinel | null = null;
        let cancelled = false;

        navigator.wakeLock
            .request('screen')
            .then((l) => {
                if (cancelled) {
                    void l.release();
                } else {
                    lock = l;
                }
            })
            .catch(() => {
                // Sin permiso o sin soporte: la pantalla se apaga como siempre.
            });

        return () => {
            cancelled = true;
            void lock?.release();
        };
    }, [active]);
}

/**
 * Reloj de la sesión: segundos transcurridos desde que empezó, descontando
 * las pausas. Al volver a la página, retoma desde la hora del servidor.
 */
function useSessionClock(session: Session | null, serverNow: string) {
    const [start] = useState(() =>
        session
            ? Date.now() -
              Math.max(
                  0,
                  Date.parse(serverNow) - Date.parse(session.started_at),
              )
            : 0,
    );
    const [now, setNow] = useState(() => Date.now());
    const [pausedSince, setPausedSince] = useState<number | null>(null);
    const [pausedTotal, setPausedTotal] = useState(0);

    useEffect(() => {
        if (!session) {
            return;
        }

        const id = window.setInterval(() => setNow(Date.now()), 250);

        return () => window.clearInterval(id);
    }, [session]);

    const elapsed = session
        ? Math.max(0, ((pausedSince ?? now) - start - pausedTotal) / 1000)
        : 0;

    const togglePause = () => {
        if (pausedSince === null) {
            setPausedSince(Date.now());
        } else {
            setPausedTotal((t) => t + Date.now() - pausedSince);
            setPausedSince(null);
        }
    };

    return { elapsed, paused: pausedSince !== null, togglePause };
}

/**
 * Inertia reutiliza la página al volver del POST que inicia la sesión: con
 * la `key` se arma de cero (reloj incluido) cada vez que cambia la sesión.
 */
export default function Entrenar(props: Props) {
    return <Training key={props.session?.id ?? 'sin-sesion'} {...props} />;
}

function Training({ reto, semana, session, server_now, demo }: Props) {
    const { confirm } = useConfirm();
    const totalReal = reto.steps.reduce((sum, s) => sum + s.seconds, 0);
    // Con el cronómetro rápido la sesión dura menos: los pasos se acortan
    // en la misma proporción.
    const factor = session ? session.duration_seconds / totalReal : 1;
    const steps = reto.steps.map((s) => ({
        ...s,
        seconds: s.seconds * factor,
    }));
    const total = steps.reduce((sum, s) => sum + s.seconds, 0);

    const { elapsed, paused, togglePause } = useSessionClock(
        session,
        server_now,
    );
    const done = session !== null && elapsed >= total;

    // Paso actual y cuánto le queda.
    let index = steps.length - 1;
    let stepEnd = total;
    for (let i = 0, acc = 0; i < steps.length; i++) {
        acc += steps[i].seconds;
        if (elapsed < acc) {
            index = i;
            stepEnd = acc;
            break;
        }
    }
    const step = steps[index];
    const stepLeft = stepEnd - elapsed;

    // Aviso al pasar de un paso a otro (y al terminar).
    const lastSignal = useRef(index);
    useEffect(() => {
        if (session && (index !== lastSignal.current || done)) {
            lastSignal.current = done ? -1 : index;
            signal();
        }
    }, [index, done, session]);

    useWakeLock(session !== null && !paused && !done);

    // Al terminar, se guarda solo (una vez); si falla, queda el botón.
    const [saving, setSaving] = useState(false);
    const submitted = useRef(false);
    const complete = () => {
        if (!session) {
            return;
        }

        setSaving(true);
        router.post(
            `/retos/entrenamientos/${session.id}/completar`,
            {},
            { onFinish: () => setSaving(false) },
        );
    };
    useEffect(() => {
        if (done && !submitted.current) {
            submitted.current = true;
            complete();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done]);

    const start = () =>
        // Sin preserveScroll: la página sube para que se vea el paso actual.
        router.post(`/retos/${reto.id}/entrenar`);

    const back =
        reto.kind === 'secreto' && reto.habilidad
            ? `/retos/arbol?arbol=${reto.habilidad.tree}&habilidad=${reto.habilidad.id}`
            : '/retos';

    const leave = async () => {
        if (session && !done) {
            const ok = await confirm({
                title: '¿Salir del entrenamiento?',
                description:
                    'Si sales ahora, este entrenamiento no cuenta. Puedes volver y retomarlo durante un rato.',
                confirmLabel: 'Salir',
            });

            if (!ok) {
                return;
            }
        }

        router.visit(back);
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Entrenar: ${reto.title}`} />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => void leave()}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {reto.kind === 'secreto'
                            ? 'Volver al árbol'
                            : 'Volver a retos'}
                    </button>

                    <div>
                        <p className="text-xs font-medium tracking-wide text-primary uppercase">
                            {retoContext(reto)}
                        </p>
                        <h1 className="mt-1 font-serif text-3xl font-bold text-foreground">
                            {reto.title}
                        </h1>
                        {semana && (
                            <p className="mt-1 text-sm text-muted-foreground">
                                Semana: día {Math.min(semana.day, WEEK_DAYS)} de{' '}
                                {WEEK_DAYS} · {semana.days_done.length}{' '}
                                {semana.days_done.length === 1
                                    ? 'día entrenado'
                                    : 'días entrenados'}{' '}
                                · {weekStatus(semana.days_done.length)}
                                {semana.trained_today &&
                                    ' · Hoy ya cuenta: entrenar otra vez no suma otro día.'}
                            </p>
                        )}
                    </div>

                    <FlashMessage />

                    {!session && (
                        <div className="rounded-xl border border-border bg-card p-5">
                            {reto.description && (
                                <p className="text-muted-foreground">
                                    {reto.description}
                                </p>
                            )}
                            <StepList steps={reto.steps} current={-1} />
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <Button
                                    size="lg"
                                    className="gap-2"
                                    onClick={start}
                                >
                                    <Play className="h-5 w-5" />
                                    Iniciar entrenamiento ·{' '}
                                    {formatMinutes(reto.minutes)}
                                </Button>
                                {demo.fast && (
                                    <span className="flex items-center gap-1.5 text-sm text-primary">
                                        <FastForward className="h-4 w-4" />
                                        Cronómetro rápido: dura 30 veces menos
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {session && !done && (
                        <>
                            <div className="rounded-xl border border-primary/40 bg-card p-6 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Paso {index + 1} de {steps.length}
                                </p>
                                <h2 className="mt-2 font-serif text-2xl font-bold text-foreground">
                                    {step.title}
                                </h2>
                                <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
                                    {step.detail}
                                </p>
                                <p
                                    className={cn(
                                        'mt-6 font-mono text-6xl font-bold tabular-nums',
                                        paused
                                            ? 'text-muted-foreground'
                                            : 'text-primary',
                                    )}
                                    aria-live="off"
                                >
                                    {formatClock(stepLeft)}
                                </p>
                                <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-secondary">
                                    <div
                                        className="h-full bg-primary transition-[width] duration-200"
                                        style={{
                                            width: `${(1 - stepLeft / step.seconds) * 100}%`,
                                        }}
                                    />
                                </div>
                                {index + 1 < steps.length && (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        Después: {steps[index + 1].title}
                                    </p>
                                )}
                                <div className="mt-6 flex justify-center gap-3">
                                    <Button
                                        size="lg"
                                        variant={paused ? 'default' : 'outline'}
                                        className="gap-2"
                                        onClick={togglePause}
                                    >
                                        {paused ? (
                                            <>
                                                <Play className="h-5 w-5" />
                                                Reanudar
                                            </>
                                        ) : (
                                            <>
                                                <Pause className="h-5 w-5" />
                                                Pausar
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="mt-4 text-xs text-muted-foreground">
                                    Faltan {formatClock(total - elapsed)} en
                                    total
                                </p>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-5">
                                <StepList steps={steps} current={index} />
                            </div>
                        </>
                    )}

                    {done && (
                        <div className="rounded-xl border border-primary/40 bg-card p-8 text-center">
                            <Trophy className="mx-auto h-12 w-12 text-primary" />
                            <h2 className="mt-3 font-serif text-2xl font-bold text-foreground">
                                ¡Entrenamiento completo!
                            </h2>
                            {saving ? (
                                <p className="mt-3 flex items-center justify-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Guardando…
                                </p>
                            ) : (
                                <Button className="mt-4" onClick={complete}>
                                    Guardar entrenamiento
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}

/** Los pasos de la rutina, con los ya hechos tachados y el actual resaltado. */
function StepList({ steps, current }: { steps: Paso[]; current: number }) {
    return (
        <ol className="mt-4 space-y-3">
            {steps.map((s, i) => {
                const past = current >= 0 && i < current;
                const now = i === current;

                return (
                    <li
                        key={i}
                        className={cn(
                            'flex gap-3',
                            past && 'opacity-50',
                            now && 'text-primary',
                        )}
                    >
                        {past ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        ) : (
                            <Circle
                                className={cn(
                                    'mt-0.5 h-5 w-5 shrink-0',
                                    now
                                        ? 'text-primary'
                                        : 'text-muted-foreground',
                                )}
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <p
                                className={cn(
                                    'font-medium',
                                    now ? 'text-primary' : 'text-foreground',
                                )}
                            >
                                {s.title}{' '}
                                <span className="font-normal text-muted-foreground">
                                    · {formatClock(s.seconds)}
                                </span>
                            </p>
                            {current < 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {s.detail}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
