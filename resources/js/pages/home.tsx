import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Trophy } from 'lucide-react';
import { useState } from 'react';
import { CalendarNav } from '@/components/eventos/calendar-nav';
import { EventDetailDialog } from '@/components/eventos/event-detail-dialog';
import { MonthView } from '@/components/eventos/month-view';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/home/hero';
import { Navigation } from '@/components/navigation';
import { ActiveWeekCard } from '@/components/retos/active-week-card';
import { CelebrationDialog } from '@/components/retos/celebration-dialog';
import { TreeProgressRings } from '@/components/retos/progress-ring';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';
import type { Celebration, TreeProgress } from '@/lib/celebraciones';
import type { SemanaActiva } from '@/lib/retos';

interface Props {
    calendar: CalendarData;
    /** Retos en curso (null sin el permiso de Entrenar ni del árbol). */
    retos: {
        active: SemanaActiva[];
        today: string;
        /** Null sin el permiso del árbol. */
        progress: TreeProgress | null;
        celebrations: Celebration[];
    } | null;
}

export default function HomePage({ calendar, retos }: Props) {
    const [selected, setSelected] = useState<{
        event: CalendarEvent;
        date: string;
    } | null>(null);

    return (
        <main className="min-h-screen">
            <Head title="Repositorio del grupo" />
            <Navigation />
            <Hero />

            {retos && <RetosSection retos={retos} />}

            {/* Calendario del mes (solo ver; crear y editar en /eventos). */}
            <section
                aria-labelledby="calendario"
                className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
            >
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2
                            id="calendario"
                            className="font-serif text-3xl font-bold text-foreground"
                        >
                            Calendario
                        </h2>
                        <p className="mt-1 text-muted-foreground">
                            Próximas clases, rodas y encuentros
                        </p>
                    </div>
                    <Link
                        href="/eventos"
                        className="inline-flex items-center gap-1 font-medium text-primary transition-all hover:gap-2"
                    >
                        Ver todos los eventos
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="mb-3">
                    <CalendarNav calendar={calendar} url="/" />
                </div>
                <MonthView
                    calendar={calendar}
                    onSelectEvent={(event, date) =>
                        setSelected({ event, date })
                    }
                />
            </section>

            <Footer />

            <EventDetailDialog
                event={selected?.event ?? null}
                date={selected?.date ?? null}
                onClose={() => setSelected(null)}
            />
        </main>
    );
}

/** "Tus retos": lo que hay que entrenar hoy. */
function RetosSection({ retos }: { retos: NonNullable<Props['retos']> }) {
    return (
        <section
            aria-labelledby="tus-retos"
            className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
        >
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2
                        id="tus-retos"
                        className="flex items-center gap-2 font-serif text-3xl font-bold text-foreground"
                    >
                        <Trophy className="h-7 w-7 text-primary" />
                        Tus retos
                    </h2>
                    <p className="mt-1 text-muted-foreground">
                        Lo que te toca entrenar esta semana
                    </p>
                </div>
                <Link
                    href="/retos"
                    className="inline-flex items-center gap-1 font-medium text-primary transition-all hover:gap-2"
                >
                    {retos.active.length > 0
                        ? 'Ver todos los retos'
                        : 'Elegir un reto'}
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {retos.progress && (
                <TreeProgressRings progress={retos.progress} className="mb-4" />
            )}

            {retos.active.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                    No tienes retos en curso.{' '}
                    <Link href="/retos" className="font-medium text-primary">
                        Acepta uno
                    </Link>{' '}
                    y entrena 7 días para ganar una medalla.
                </p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {retos.active.map((semana) => (
                        <ActiveWeekCard
                            key={semana.id}
                            semana={semana}
                            today={retos.today}
                        />
                    ))}
                </div>
            )}

            <CelebrationDialog items={retos.celebrations} />
        </section>
    );
}
