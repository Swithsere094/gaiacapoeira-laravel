export type EncuentroEstado =
    | 'borrador'
    | 'publicado'
    | 'cerrado'
    | 'terminado';

export type PagoEstado = 'pendiente' | 'parcial' | 'pagado';

/** Estado de un pago del historial (no el de la inscripción). */
export type PagoRegistroEstado = 'reportado' | 'confirmado' | 'rechazado';

/** Un pago del historial de una inscripción. */
export interface PagoRow {
    id: string;
    monto: number;
    fecha: string;
    metodo: string | null;
    estado: PagoRegistroEstado;
    /** Solo para el organizador. */
    nota?: string | null;
    origen?: 'participante' | 'organizador';
    /** Dirección del comprobante (solo para el organizador). */
    comprobante?: string | null;
}

export interface PrecioOpcion {
    id: string;
    nombre: string;
    descripcion: string | null;
    valor: number;
}

/** Una actividad de la programación. Horas "HH:MM" de Colombia. */
export interface Actividad {
    id: string;
    fecha: string;
    hora_inicio: string | null;
    hora_fin: string | null;
    titulo: string;
    descripcion: string | null;
}

/** Invitado de un encuentro. */
export interface Invitado {
    id: string;
    nombre: string;
    titulo: string | null;
    grupo: string | null;
    ciudad: string | null;
    bio: string | null;
}

/** Encuentro como lo ve quien lo gestiona. */
export interface Encuentro {
    id: string;
    slug: string;
    nombre: string;
    starts_on: string;
    ends_on: string | null;
    lugar: string | null;
    direccion: string | null;
    mapa_url: string | null;
    descripcion: string | null;
    info_pago: string | null;
    portada_url: string | null;
    cupo: number | null;
    inscripciones_desde: string | null;
    inscripciones_hasta: string | null;
    estado: EncuentroEstado;
    subdominio: 'ninguno' | 'creado' | 'error';
    url: string;
    respaldo_url: string;
    precios: PrecioOpcion[];
    actividades: Actividad[];
    invitados: (Invitado & { foto_url: string | null })[];
}

/** Inscripción en el panel del organizador. */
export interface InscripcionRow {
    id: string;
    codigo: string;
    nombre: string;
    apelido: string | null;
    grupo: string;
    profesor: string | null;
    graduacion: string | null;
    ciudad: string;
    telefono: string;
    email: string | null;
    talla: string | null;
    emergencia_nombre: string;
    emergencia_telefono: string;
    precio_nombre: string;
    precio_valor: number;
    pago_estado: PagoEstado;
    monto_pagado: number;
    estado: 'activa' | 'cancelada';
    notas: string | null;
    asistio: boolean;
    created_at: string;
    /** Pagos que reportó la persona y faltan revisar. */
    por_revisar: number;
    pagos: PagoRow[];
}

/** Encuentro en su página pública (sin datos internos). */
export interface EncuentroPublico {
    nombre: string;
    starts_on: string;
    ends_on: string | null;
    lugar: string | null;
    mapa_url: string | null;
    descripcion: string | null;
    info_pago: string | null;
    portada: string | null;
    inscripciones_desde: string | null;
    inscripciones_hasta: string | null;
    estado: EncuentroEstado;
    /** Base de las direcciones: '' en el subdominio, '/e/slug' en el respaldo. */
    base: string;
    precios: PrecioOpcion[];
    /** Solo en la página del encuentro (no en la consulta de la inscripción). */
    direccion?: string | null;
    actividades?: Actividad[];
    invitados?: (Invitado & { foto: string | null })[];
}
