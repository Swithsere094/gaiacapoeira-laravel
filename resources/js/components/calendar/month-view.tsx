import { useMemo, useState } from 'react';
import { DayEventList } from '@/components/calendar/day-event-list';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';
import {
    WEEKDAYS,
    dayOfMonth,
    daysBetween,
    eventsByDay,
    longDate,
    sameMonth,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';

/** Cuántos eventos caben en una celda antes del "+N más". */
const MAX_CHIPS = 3;

/**
 * Vista de mes (lunes a domingo). En pantallas grandes cada día muestra sus
 * eventos; en el celular, puntos. Al tocar un día, su lista aparece debajo.
 */
export function MonthView({
    calendar,
    onSelectEvent,
}: {
    calendar: CalendarData;
    onSelectEvent: (event: CalendarEvent, date: string) => void;
}) {
    const byDay = useMemo(() => eventsByDay(calendar), [calendar]);
    const days = daysBetween(calendar.from, calendar.to);
    const [selected, setSelected] = useState<string | null>(null);

    // El día elegido solo vale dentro del mes que se ve; si no, hoy (si está).
    const selectedDay =
        selected && sameMonth(selected, calendar.date)
            ? selected
            : sameMonth(calendar.today, calendar.date)
              ? calendar.today
              : null;
    const selectedEvents = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

    return (
        <div>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="grid grid-cols-7 border-b border-border bg-secondary/40">
                    {WEEKDAYS.map((d) => (
                        <div
                            key={d.iso}
                            className="py-2 text-center text-xs font-medium text-muted-foreground"
                        >
                            <span className="sm:hidden">{d.short}</span>
                            <span className="hidden sm:inline">
                                {d.label.slice(0, 3)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {days.map((day, i) => {
                        const events = byDay.get(day) ?? [];
                        const inMonth = sameMonth(day, calendar.date);
                        const isToday = day === calendar.today;
                        const isSelected = day === selectedDay;

                        return (
                            <div
                                key={day}
                                className={cn(
                                    'min-h-14 border-border p-1 sm:min-h-28 sm:p-1.5',
                                    i % 7 !== 6 && 'border-r',
                                    i < days.length - 7 && 'border-b',
                                    !inMonth && 'bg-background/40',
                                    isSelected && 'bg-primary/10',
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => setSelected(day)}
                                    className="flex w-full flex-col items-center gap-1 sm:items-start"
                                    aria-label={`${longDate(day)}: ${events.length === 1 ? '1 evento' : `${events.length} eventos`}`}
                                    aria-pressed={isSelected}
                                >
                                    <span
                                        className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-full text-sm',
                                            isToday
                                                ? 'bg-primary font-bold text-primary-foreground'
                                                : inMonth
                                                  ? 'text-foreground'
                                                  : 'text-muted-foreground/60',
                                        )}
                                    >
                                        {dayOfMonth(day)}
                                    </span>
                                    {/* Celular: un punto por evento (máx. 3). */}
                                    {events.length > 0 && (
                                        <span className="flex gap-0.5 sm:hidden">
                                            {events
                                                .slice(0, MAX_CHIPS)
                                                .map((e) => (
                                                    <span
                                                        key={e.id}
                                                        className="h-1.5 w-1.5 rounded-full bg-primary"
                                                    />
                                                ))}
                                        </span>
                                    )}
                                </button>

                                {/* Pantallas grandes: el título de cada evento. */}
                                <div className="mt-1 hidden space-y-1 sm:block">
                                    {events.slice(0, MAX_CHIPS).map((e) => (
                                        <button
                                            key={e.id}
                                            type="button"
                                            onClick={() =>
                                                onSelectEvent(e, day)
                                            }
                                            className="block w-full truncate rounded bg-primary/20 px-1.5 py-0.5 text-left text-xs text-foreground transition-colors hover:bg-primary/30"
                                            title={e.title}
                                        >
                                            {e.start_time && (
                                                <span className="mr-1 font-medium">
                                                    {e.start_time}
                                                </span>
                                            )}
                                            {e.title}
                                        </button>
                                    ))}
                                    {events.length > MAX_CHIPS && (
                                        <button
                                            type="button"
                                            onClick={() => setSelected(day)}
                                            className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            +{events.length - MAX_CHIPS} más
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDay && (
                <div className="mt-4">
                    <h3 className="mb-2 font-serif text-lg font-bold text-foreground">
                        {longDate(selectedDay)}
                    </h3>
                    <DayEventList
                        events={selectedEvents}
                        date={selectedDay}
                        onSelectEvent={onSelectEvent}
                    />
                </div>
            )}
        </div>
    );
}
