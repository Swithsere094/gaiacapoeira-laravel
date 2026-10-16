import { Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { CalendarNav } from '@/components/calendar/calendar-nav';
import { EventDetailDialog } from '@/components/calendar/event-detail-dialog';
import { MonthView } from '@/components/calendar/month-view';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/hero';
import { Navigation } from '@/components/navigation';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';

export default function Home({ calendar }: { calendar: CalendarData }) {
    const [selected, setSelected] = useState<{
        event: CalendarEvent;
        date: string;
    } | null>(null);

    return (
        <main className="min-h-screen">
            <Head title="Repositorio del Grupo" />
            <Navigation />
            <Hero />

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
