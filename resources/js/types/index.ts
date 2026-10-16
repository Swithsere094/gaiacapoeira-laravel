/** Usuario con sesión. Misma forma que `AppUser` del sitio original. */
export interface AppUser {
    id: string;
    username: string;
    name: string;
    email: string | null;
    /** Slug del rol (`admin`, `member` o uno creado en Gestión de Roles). */
    role: string;
    /** Nombre visible del rol. */
    role_name: string;
    apodo: string | null;
    avatar: string | null;
}

/** Permisos del catálogo (App\Support\Permissions). */
export type Permission =
    | 'analiticas.ver'
    | 'galera.gestionar'
    | 'politica.gestionar'
    | 'canciones.eliminar'
    | 'canciones.nossa'
    | 'eventos.gestionar';

export interface Auth {
    user: AppUser | null;
    /** Lo que puede hacer la persona con sesión (el admin, todos). */
    permissions: Permission[];
}
