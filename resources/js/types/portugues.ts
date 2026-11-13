/** Tipos de palabra (PortuguesPalabra::TIPOS). */
export type TipoPalabra =
    | 'verbo'
    | 'sustantivo'
    | 'adjetivo'
    | 'pronombre'
    | 'adverbio'
    | 'conector'
    | 'numero'
    | 'expresion';

/** Estado de una palabra para la persona (PortuguesTarjeta::estado()). */
export type EstadoPalabra = 'sin_trabajar' | 'con_asociacion' | 'aprendida';

/** Calificación de una flashcard (App\Support\Repaso::NOTAS). */
export type NotaRepaso = 'otra_vez' | 'dificil' | 'bien' | 'facil';

/** Una de las 1000 palabras, por orden de frecuencia. */
export interface Palabra {
    id: string;
    posicion: number;
    palabra: string;
    traduccion: string;
    tipo: TipoPalabra;
    /** Formas que se sumaron para ordenarla (é, foi, era → ser). */
    formas: string[];
    ejemplo: string | null;
    ejemplo_traduccion: string | null;
    /** En cuántas canciones de Sabiá cantou aparece. */
    canciones: number;
}

/** Lo de la persona con una palabra. */
export interface Tarjeta {
    suena_como: string | null;
    asociacion: string | null;
    frase: string | null;
    intervalo: number;
    /** Y-m-d, o null si nunca entró al repaso. */
    proximo_repaso: string | null;
    saltada: boolean;
    estado: EstadoPalabra;
}

export interface PortuguesProps {
    palabras: Palabra[];
    /** Por id de palabra; solo las que la persona tocó. */
    tarjetas: Record<string, Tarjeta>;
    lotesAvanzados: number[];
    hoy: string;
    loteTamano: number;
    aprendidaDias: number;
}
