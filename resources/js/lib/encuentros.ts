import { formatDate } from '@/lib/dates';
import { INTL_LOCALES } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type {
    Actividad,
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
export function formatRange(
    start: string,
    end: string | null,
    locale: Locale = 'es',
): string {
    const intl = INTL_LOCALES[locale];

    return end && end !== start
        ? `${formatDate(start, 'long', intl)} – ${formatDate(end, 'long', intl)}`
        : formatDate(start, 'long', intl);
}

/** Días del encuentro (Y-m-d), del inicio al fin. Máximo 60 por las dudas. */
export function diasDelEncuentro(start: string, end: string | null): string[] {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) {
        return [];
    }
    const dias = [start];
    const [y, m, d] = start.split('-').map(Number);
    // En UTC para no depender del huso del navegador.
    const cursor = new Date(Date.UTC(y, m - 1, d));
    const fin = end && end > start ? end : start;
    while (dias.length < 60) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        const dia = cursor.toISOString().slice(0, 10);
        if (dia > fin) {
            break;
        }
        dias.push(dia);
    }

    return dias;
}

/** "8:00 a. m. – 12:00 p. m." en formato de 12 horas, o '' sin hora. */
export function formatHorario(
    a: Pick<Actividad, 'hora_inicio' | 'hora_fin'>,
    locale: Locale = 'es',
): string {
    const hora = (value: string) => {
        const [h, min] = value.split(':').map(Number);
        if (locale !== 'es') {
            // pt: "08:00"; en: "8:00 AM". En UTC para que no lo mueva el huso.
            return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'UTC',
            }).format(Date.UTC(2000, 0, 1, h, min));
        }
        const sufijo = h < 12 ? 'a. m.' : 'p. m.';

        return `${h % 12 || 12}:${String(min).padStart(2, '0')} ${sufijo}`;
    };
    if (!a.hora_inicio) {
        return '';
    }

    return a.hora_fin
        ? `${hora(a.hora_inicio)} – ${hora(a.hora_fin)}`
        : hora(a.hora_inicio);
}

/** Actividades agrupadas por día, en el orden en que llegan. */
export function agruparPorDia(
    actividades: Actividad[],
): [string, Actividad[]][] {
    const grupos = new Map<string, Actividad[]>();
    for (const a of actividades) {
        grupos.set(a.fecha, [...(grupos.get(a.fecha) ?? []), a]);
    }

    return [...grupos.entries()];
}

/** Mapa de Google embebido a partir de una dirección (no necesita clave). */
export function mapaEmbedUrl(direccion: string): string {
    return `https://www.google.com/maps?q=${encodeURIComponent(direccion)}&output=embed`;
}

/** "Cómo llegar": el enlace que puso el organizador o una búsqueda de la dirección. */
export function mapaLinkUrl(
    direccion: string | null,
    enlace: string | null,
): string | null {
    if (enlace) {
        return enlace;
    }

    return direccion
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`
        : null;
}

/** "M · corte femenino", o null sin talla. */
export function formatCamiseta(
    talla: string | null,
    corte: string | null,
): string | null {
    if (!talla) {
        return null;
    }

    return corte ? `${talla} · corte ${corte}` : talla;
}

export const ESTADO_LABELS: Record<EncuentroEstado, string> = {
    borrador: 'Borrador',
    publicado: 'Publicado',
    cerrado: 'Inscripciones cerradas',
    terminado: 'Terminado (recuerdo)',
    archivado: 'Archivado (sin página)',
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
    archivado: 'bg-muted text-muted-foreground',
};

export const PAGO_CLASSES: Record<PagoEstado, string> = {
    pendiente: 'bg-destructive/15 text-foreground',
    parcial: 'bg-chart-4/20 text-foreground',
    pagado: 'bg-primary/20 text-foreground',
};
