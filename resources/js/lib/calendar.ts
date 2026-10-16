/**
 * Calendario de eventos: tipos (los arma App\Support\EventCalendar) y
 * utilidades de fechas.
 *
 * Las fechas viajan como texto `Y-m-d` en hora de Colombia y así se usan:
 * para calcular y formatear se interpretan en UTC, de modo que el huso
 * horario del navegador nunca corre el día.
 */

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    starts_on: string;
    ends_on: string | null;
    /** `HH:MM`; null = todo el día. */
    start_time: string | null;
    end_time: string | null;
    /** Días ISO (1 = lunes … 7 = domingo); null = no se repite. */
    repeat_days: number[] | null;
    author: string | null;
    can_edit: boolean;
}

export interface CalendarData {
    view: 'mes' | 'semana';
    /** Fecha de referencia (el mes o la semana que se ve). */
    date: string;
    from: string;
    to: string;
    today: string;
    events: CalendarEvent[];
    /** Un registro por cada día en que ocurre cada evento, ya ordenados. */
    occurrences: { date: string; event_id: string }[];
}

export const WEEKDAYS = [
    { iso: 1, short: 'L', label: 'Lunes' },
    { iso: 2, short: 'M', label: 'Martes' },
    { iso: 3, short: 'Mi', label: 'Miércoles' },
    { iso: 4, short: 'J', label: 'Jueves' },
    { iso: 5, short: 'V', label: 'Viernes' },
    { iso: 6, short: 'S', label: 'Sábado' },
    { iso: 7, short: 'D', label: 'Domingo' },
];

const LOCALE = 'es-CO';

function toUtc(date: string): Date {
    const [y, m, d] = date.split('-').map(Number);

    return new Date(Date.UTC(y, m - 1, d));
}

function toYmd(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function format(date: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(LOCALE, {
        ...options,
        timeZone: 'UTC',
    }).format(toUtc(date));
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function addDays(date: string, days: number): string {
    const d = toUtc(date);
    d.setUTCDate(d.getUTCDate() + days);

    return toYmd(d);
}

/** Primer día del mes que está `months` meses antes o después. */
export function addMonths(date: string, months: number): string {
    const d = toUtc(date);

    return toYmd(
        new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1)),
    );
}

/** Todos los días de `from` a `to`, ambos incluidos. */
export function daysBetween(from: string, to: string): string[] {
    const days: string[] = [];

    for (let d = from; d <= to; d = addDays(d, 1)) {
        days.push(d);
    }

    return days;
}

export function dayOfMonth(date: string): number {
    return Number(date.slice(8, 10));
}

export function sameMonth(a: string, b: string): boolean {
    return a.slice(0, 7) === b.slice(0, 7);
}

/** "Noviembre de 2026" */
export function monthTitle(date: string): string {
    return capitalize(format(date, { month: 'long', year: 'numeric' }));
}

/** "2 – 8 de noviembre de 2026" (o "28 de oct. – 3 de nov. de 2026") */
export function weekTitle(from: string, to: string): string {
    if (sameMonth(from, to)) {
        return `${dayOfMonth(from)} – ${format(to, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    return `${format(from, { day: 'numeric', month: 'short' })} – ${format(to, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/** "Martes, 3 de noviembre" */
export function longDate(date: string): string {
    return capitalize(
        format(date, { weekday: 'long', day: 'numeric', month: 'long' }),
    );
}

/** "3 de nov. de 2026" */
export function shortDate(date: string): string {
    return format(date, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "Mar" */
export function weekdayShort(date: string): string {
    return capitalize(format(date, { weekday: 'short' }).replace('.', ''));
}

/** "18:00" → "6:00 p. m." */
export function formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);

    return new Intl.DateTimeFormat(LOCALE, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
    }).format(new Date(Date.UTC(1970, 0, 1, h, m)));
}

/** "Todo el día", "6:00 p. m." o "6:00 p. m. – 8:00 p. m." */
export function timeRange(event: CalendarEvent): string {
    if (!event.start_time) {
        return 'Todo el día';
    }

    return event.end_time
        ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`
        : formatTime(event.start_time);
}

/** Cuándo ocurre, en palabras: "Martes y jueves, del 3 de nov. … al …". */
export function scheduleText(event: CalendarEvent): string {
    if (event.repeat_days?.length) {
        const names = WEEKDAYS.filter((d) =>
            event.repeat_days?.includes(d.iso),
        ).map((d) => d.label.toLowerCase());
        const days =
            names.length > 1
                ? `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`
                : names[0];

        return `${capitalize(days)}, del ${shortDate(event.starts_on)} al ${shortDate(event.ends_on ?? event.starts_on)}`;
    }

    if (event.ends_on) {
        return `Del ${shortDate(event.starts_on)} al ${shortDate(event.ends_on)}`;
    }

    return `${longDate(event.starts_on)} de ${event.starts_on.slice(0, 4)}`;
}

/** Eventos de cada día, en el orden en que llegan (todo el día y por hora). */
export function eventsByDay(
    calendar: CalendarData,
): Map<string, CalendarEvent[]> {
    const byId = new Map(calendar.events.map((e) => [e.id, e]));
    const days = new Map<string, CalendarEvent[]>();

    for (const { date, event_id } of calendar.occurrences) {
        const event = byId.get(event_id);

        if (event) {
            days.set(date, [...(days.get(date) ?? []), event]);
        }
    }

    return days;
}
