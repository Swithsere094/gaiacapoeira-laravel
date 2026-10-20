import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Trophy } from 'lucide-react';
import { useState } from 'react';
import { CalendarNav } from '@/components/calendar/calendar-nav';
import { EventDetailDialog } from '@/components/calendar/event-detail-dialog';
import { MonthView } from '@/components/calendar/month-view';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Navigation } from '@/components/navigation';
import { ActiveWeekCard } from '@/components/retos/active-week-card';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';
import type { SemanaActiva } from '@/lib/retos';

interface Props {
    calendar: CalendarData;
    /** Retos en curso (demo: solo llega para admins). */
    retos: { active: SemanaActiva[]; today: string } | null;
}

export default function Home({ calendar, retos }: Props) {
    const [selected, setSelected] = useState<{
        event: CalendarEvent;
        date: string;
    } | null>(null);

    return (
        <main className="min-h-screen">
            <Head title="Repositorio del Grupo" />
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

/** "Tus retos": lo que hay que entrenar hoy (demo, solo admins). */
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
                        Demo: por ahora solo lo ven los admins
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
        </section>
    );
}
