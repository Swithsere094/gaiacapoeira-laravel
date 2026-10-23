import { useMemo } from 'react';
import { DayEventList } from '@/components/eventos/day-event-list';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';
import {
    dayOfMonth,
    daysBetween,
    eventsByDay,
    longDate,
    weekdayShort,
} from '@/lib/calendar';
import { cn } from '@/lib/utils';

/**
 * Vista de semana (lunes a domingo): siete columnas en pantallas grandes y
 * los días uno debajo del otro en el celular.
 */
export function WeekView({
    calendar,
    onSelectEvent,
}: {
    calendar: CalendarData;
    onSelectEvent: (event: CalendarEvent, date: string) => void;
}) {
    const byDay = useMemo(() => eventsByDay(calendar), [calendar]);
    const days = daysBetween(calendar.from, calendar.to);

    return (
        <div className="grid gap-3 lg:grid-cols-7 lg:gap-2">
            {days.map((day) => {
                const isToday = day === calendar.today;

                return (
                    <section
                        key={day}
                        aria-label={longDate(day)}
                        className={cn(
                            'rounded-xl bg-card p-3 lg:min-h-48 lg:p-2',
                            isToday && 'ring-2 ring-primary',
                        )}
                    >
                        <h3 className="mb-2 flex items-baseline gap-2 lg:flex-col lg:items-center lg:gap-0">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                {weekdayShort(day)}
                            </span>
                            <span
                                className={cn(
                                    'font-serif text-lg font-bold',
                                    isToday
                                        ? 'text-primary'
                                        : 'text-foreground',
                                )}
                            >
                                {dayOfMonth(day)}
                            </span>
                        </h3>
                        <DayEventList
                            events={byDay.get(day) ?? []}
                            date={day}
                            onSelectEvent={onSelectEvent}
                            compact
                        />
                    </section>
                );
            })}
        </div>
    );
}
