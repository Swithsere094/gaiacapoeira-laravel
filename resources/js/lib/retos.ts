/**
 * Retos y árbol de habilidades (demo, solo admins): tipos (los arma
 * App\Support\RetosView) y textos compartidos.
 *
 * Las fechas son `Y-m-d` en hora de Colombia (ver lib/calendar.ts).
 */
import { addDays } from '@/lib/calendar';

export type Medal = 'oro' | 'plata' | 'bronce';

export type MedalCount = Record<Medal, number>;

export type Tree = 'movimiento' | 'musicalidad';

export interface Paso {
    title: string;
    detail: string;
    seconds: number;
}

export interface RetoResumen {
    id: string;
    kind: 'practica' | 'secreto' | 'suelto';
    category: string | null;
    title: string;
    description: string | null;
    minutes: number;
    habilidad: { id: string; name: string; tree: Tree } | null;
    medals: MedalCount;
}

export interface SemanaActiva {
    id: string;
    reto: RetoResumen;
    starts_on: string;
    ends_on: string;
    /** Día de la semana del reto (1 a 7). */
    day: number;
    /** Fechas con al menos un entrenamiento completado. */
    days_done: string[];
    trained_today: boolean;
    /** La medalla que tendría si la semana terminara hoy. */
    medal_so_far: Medal | null;
}

export interface SemanaTerminada {
    id: string;
    title: string;
    habilidad: string | null;
    ends_on: string;
    days: number;
    medal: Medal | null;
}

export interface HabilidadFrontera {
    id: string;
    name: string;
    tree: Tree;
    description: string | null;
    valid_weeks: number;
    secret_weeks: number;
    secret_unlocked: boolean;
    reto: RetoResumen | null;
    /** Por qué no se puede aceptar su reto ahora (null = se puede). */
    blocked: string | null;
}

export interface RetoSuelto extends RetoResumen {
    blocked: string | null;
}

/** Controles de prueba del demo (App\Support\RetosDemo). */
export interface RetosDemoState {
    /** "Hoy", con los días simulados. */
    today: string;
    offset: number;
    fast: boolean;
}

export const WEEK_DAYS = 7;

/** Días mínimos de cada medalla (de mayor a menor), como en el servidor. */
export const MEDAL_MIN_DAYS: [Medal, number][] = [
    ['oro', 6],
    ['plata', 5],
    ['bronce', 4],
];

export const MEDAL_STYLE: Record<Medal, { label: string; className: string }> =
    {
        oro: { label: 'Oro', className: 'text-[#E3C770]' },
        plata: { label: 'Plata', className: 'text-[#C9D1D9]' },
        bronce: { label: 'Bronce', className: 'text-[#CD8B52]' },
    };

export const TREE_LABELS: Record<Tree, string> = {
    movimiento: 'Movimiento',
    musicalidad: 'Musicalidad',
};

export const CATEGORY_LABELS: Record<string, string> = {
    flexibilidad: 'Flexibilidad',
    fortalecimiento: 'Fortalecimiento',
    resistencia: 'Resistencia',
    movilidad: 'Movilidad',
    musicalidad: 'Musicalidad',
};

/** Los 7 días de una semana de reto. */
export function weekDates(startsOn: string): string[] {
    return Array.from({ length: WEEK_DAYS }, (_, i) => addDays(startsOn, i));
}

/**
 * Cómo va la semana: "Te faltan 2 días para el bronce", "Vas en plata: un
 * día más y es oro", "¡Oro asegurado!".
 */
export function weekStatus(days: number): string {
    const [, bronce] = MEDAL_MIN_DAYS[2];

    if (days >= MEDAL_MIN_DAYS[0][1]) {
        return '¡Oro asegurado!';
    }

    if (days === MEDAL_MIN_DAYS[1][1]) {
        return 'Vas en plata: un día más y es oro';
    }

    if (days === bronce) {
        return 'Vas en bronce: un día más y es plata';
    }

    const missing = bronce - days;

    return missing === 1
        ? 'Te falta 1 día para el bronce'
        : `Te faltan ${missing} días para el bronce`;
}

/** "12 min" / "1 h 5 min" */
export function formatMinutes(minutes: number): string {
    return minutes < 60
        ? `${minutes} min`
        : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

/** "02:35" */
export function formatClock(seconds: number): string {
    const s = Math.max(0, Math.ceil(seconds));

    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
