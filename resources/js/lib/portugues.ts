import { router } from '@inertiajs/react';
import type {
    EstadoPalabra,
    Palabra,
    Tarjeta,
    TipoPalabra,
} from '@/types/portugues';

/** Nombre de cada tipo, en plural para los mazos y filtros. */
export const TIPOS: { value: TipoPalabra; label: string; singular: string }[] =
    [
        { value: 'verbo', label: 'Verbos', singular: 'Verbo' },
        { value: 'sustantivo', label: 'Sustantivos', singular: 'Sustantivo' },
        { value: 'adjetivo', label: 'Adjetivos', singular: 'Adjetivo' },
        { value: 'pronombre', label: 'Pronombres', singular: 'Pronombre' },
        { value: 'adverbio', label: 'Adverbios', singular: 'Adverbio' },
        {
            value: 'conector',
            label: 'Conectores (de, que, para…)',
            singular: 'Conector',
        },
        { value: 'numero', label: 'Números', singular: 'Número' },
        { value: 'expresion', label: 'Expresiones', singular: 'Expresión' },
    ];

export function tipoLabel(tipo: TipoPalabra): string {
    return TIPOS.find((t) => t.value === tipo)?.singular ?? tipo;
}

/**
 * Palabras difíciles de imaginar: para ellas el formulario sugiere usar una
 * frase de ejemplo en lugar de la asociación.
 */
export const TIPOS_ABSTRACTOS: TipoPalabra[] = [
    'pronombre',
    'adverbio',
    'conector',
    'numero',
    'expresion',
];

export const ESTADOS: { value: EstadoPalabra; label: string }[] = [
    { value: 'sin_trabajar', label: 'Sin trabajar' },
    { value: 'con_asociacion', label: 'Con asociación' },
    { value: 'aprendida', label: 'Aprendida' },
];

export function estadoDe(tarjeta: Tarjeta | undefined): EstadoPalabra {
    return tarjeta?.estado ?? 'sin_trabajar';
}

export function tieneAsociacion(tarjeta: Tarjeta | undefined): boolean {
    return Boolean(tarjeta?.asociacion || tarjeta?.frase);
}

export function loteDe(posicion: number, tamano: number): number {
    return Math.floor((posicion - 1) / tamano) + 1;
}

/** Primer lote sin marcar como avanzado (o null si están todos). */
export function loteActual(
    totalLotes: number,
    avanzados: number[],
): number | null {
    for (let lote = 1; lote <= totalLotes; lote++) {
        if (!avanzados.includes(lote)) {
            return lote;
        }
    }

    return null;
}

/** Le toca repaso hoy (fechas Y-m-d: se comparan como texto). */
export function paraHoy(tarjeta: Tarjeta | undefined, hoy: string): boolean {
    return Boolean(tarjeta?.proximo_repaso && tarjeta.proximo_repaso <= hoy);
}

/** Para buscar sin tildes ni mayúsculas ("nao" encuentra "não"). */
export function normalizar(texto: string): string {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

export function coincide(palabra: Palabra, busqueda: string): boolean {
    const q = normalizar(busqueda.trim());

    if (!q) {
        return true;
    }

    return (
        normalizar(palabra.palabra).includes(q) ||
        normalizar(palabra.traduccion).includes(q) ||
        palabra.formas.some((f) => normalizar(f) === q)
    );
}

/**
 * Acciones sobre las tarjetas: solo recargan lo de la persona (la lista de
 * 1000 palabras no cambia) y no mueven la pantalla.
 */
export function enviar(
    method: 'post' | 'put' | 'delete',
    url: string,
    data: Record<string, string | null> = {},
    options: Omit<
        NonNullable<Parameters<typeof router.visit>[1]>,
        'method' | 'data'
    > = {},
): void {
    router.visit(url, {
        method,
        data,
        only: ['tarjetas', 'lotesAvanzados'],
        preserveScroll: true,
        preserveState: true,
        ...options,
    });
}
