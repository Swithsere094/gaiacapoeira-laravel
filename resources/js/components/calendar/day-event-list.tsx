import { Clock, MapPin, Repeat } from 'lucide-react';
import type { CalendarEvent } from '@/lib/calendar';
import { timeRange } from '@/lib/calendar';

/** Lista de los eventos de un día (debajo del mes y en la vista de semana). */
export function DayEventList({
    events,
    date,
    onSelectEvent,
    compact = false,
}: {
    events: CalendarEvent[];
    date: string;
    onSelectEvent: (event: CalendarEvent, date: string) => void;
    compact?: boolean;
}) {
    if (events.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                {compact ? '—' : 'No hay eventos este día.'}
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {events.map((e) => (
                <li key={e.id}>
                    <button
                        type="button"
                        onClick={() => onSelectEvent(e, date)}
                        className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/60"
                    >
                        <span className="block font-medium break-words text-foreground">
                            {e.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {timeRange(e)}
                            </span>
                            {e.location && !compact && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {e.location}
                                </span>
                            )}
                            {e.repeat_days && !compact && (
                                <span className="inline-flex items-center gap-1">
                                    <Repeat className="h-3.5 w-3.5" />
                                    Se repite
                                </span>
                            )}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    );
}
