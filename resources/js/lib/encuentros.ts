import { formatDate } from '@/lib/dates';
import type {
    EncuentroEstado,
    PagoEstado,
    PagoRegistroEstado,
} from '@/types/encuentros';

/** Pesos colombianos sin decimales: "$150.000". */
export function formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
    }).format(value);
}

/** "2 de julio de 2027" o "2 de julio de 2027 – 4 de julio de 2027". */
export function formatRange(start: string, end: string | null): string {
    return end && end !== start
        ? `${formatDate(start)} – ${formatDate(end)}`
        : formatDate(start);
}

export const ESTADO_LABELS: Record<EncuentroEstado, string> = {
    borrador: 'Borrador',
    publicado: 'Publicado',
    cerrado: 'Inscripciones cerradas',
    terminado: 'Terminado',
};

export const PAGO_LABELS: Record<PagoEstado, string> = {
    pendiente: 'Pendiente',
    parcial: 'Parcial',
    pagado: 'Pagado',
};

export const PAGO_REGISTRO_LABELS: Record<PagoRegistroEstado, string> = {
    reportado: 'Por revisar',
    confirmado: 'Confirmado',
    rechazado: 'Rechazado',
};

export const PAGO_REGISTRO_CLASSES: Record<PagoRegistroEstado, string> = {
    reportado: 'bg-chart-4/20 text-foreground',
    confirmado: 'bg-primary/20 text-foreground',
    rechazado: 'bg-muted text-muted-foreground line-through',
};

/** Colores de fondo con texto claro (contraste AA, como en Política). */
export const ESTADO_CLASSES: Record<EncuentroEstado, string> = {
    borrador: 'bg-secondary text-secondary-foreground',
    publicado: 'bg-primary/20 text-foreground',
    cerrado: 'bg-chart-4/20 text-foreground',
    terminado: 'bg-muted text-muted-foreground',
};

export const PAGO_CLASSES: Record<PagoEstado, string> = {
    pendiente: 'bg-destructive/15 text-foreground',
    parcial: 'bg-chart-4/20 text-foreground',
    pagado: 'bg-primary/20 text-foreground',
};
