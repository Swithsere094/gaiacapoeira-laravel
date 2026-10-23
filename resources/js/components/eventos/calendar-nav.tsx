import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CalendarData } from '@/lib/calendar';
import { addDays, addMonths, monthTitle, weekTitle } from '@/lib/calendar';

/**
 * Título del período y botones anterior / hoy / siguiente. Cambia la fecha
 * con una visita de Inertia que solo recarga `calendar` (`?fecha=`).
 */
export function CalendarNav({
    calendar,
    url,
    params = {},
}: {
    calendar: CalendarData;
    /** Página donde está el calendario (`/` o `/eventos`). */
    url: string;
    params?: Record<string, string>;
}) {
    const isMonth = calendar.view === 'mes';
    const step = (n: number) =>
        isMonth ? addMonths(calendar.date, n) : addDays(calendar.from, 7 * n);

    const go = (fecha: string) =>
        router.get(
            url,
            { ...params, fecha },
            { only: ['calendar'], preserveScroll: true, preserveState: true },
        );

    const title = isMonth
        ? monthTitle(calendar.date)
        : weekTitle(calendar.from, calendar.to);
    const showingToday =
        calendar.today >= calendar.from && calendar.today <= calendar.to;

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => go(step(-1))}
                    aria-label={isMonth ? 'Mes anterior' : 'Semana anterior'}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => go(step(1))}
                    aria-label={isMonth ? 'Mes siguiente' : 'Semana siguiente'}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
            <h2
                className="min-w-0 font-serif text-xl font-bold text-foreground sm:text-2xl"
                aria-live="polite"
            >
                {title}
            </h2>
            {!showingToday && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => go(calendar.today)}
                >
                    Hoy
                </Button>
            )}
        </div>
    );
}
