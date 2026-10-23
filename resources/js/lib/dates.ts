/**
 * Fechas para mostrar en español.
 *
 * Gotcha: `new Date('2026-07-02')` se interpreta como medianoche UTC, y en
 * Colombia (UTC−5) eso todavía es el 1 de julio. Las fechas sin hora (Y-m-d,
 * como `event_date`) se arman con la fecha local para que no se corra el día.
 * (El calendario de eventos tiene su propio manejo en `lib/calendar.ts`.)
 */

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha del servidor como Date: Y-m-d sin correr el día, o fecha y hora ISO. */
export function parseDate(value: string): Date {
    if (DATE_ONLY.test(value)) {
        const [y, m, d] = value.split('-').map(Number);

        return new Date(y, m - 1, d);
    }

    return new Date(value);
}

const FORMATS = {
    /** "2 de julio de 2026" */
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    /** "2 jul" */
    short: { day: 'numeric', month: 'short' },
    /** "Julio de 2026" */
    month: { month: 'long', year: 'numeric' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export function formatDate(
    value: string,
    style: keyof typeof FORMATS = 'long',
): string {
    const label = parseDate(value).toLocaleDateString('es-ES', FORMATS[style]);

    return style === 'month'
        ? label.charAt(0).toUpperCase() + label.slice(1)
        : label;
}
