export type EncuentroEstado =
    | 'borrador'
    | 'publicado'
    | 'cerrado'
    | 'terminado';

export type PagoEstado = 'pendiente' | 'parcial' | 'pagado';

export interface PrecioOpcion {
    id: string;
    nombre: string;
    descripcion: string | null;
    valor: number;
}

/** Encuentro como lo ve quien lo gestiona. */
export interface Encuentro {
    id: string;
    slug: string;
    nombre: string;
    starts_on: string;
    ends_on: string | null;
    lugar: string | null;
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
    created_at: string;
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
}
