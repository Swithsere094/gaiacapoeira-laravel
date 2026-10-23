import type { Permission } from '@/types';

/** Rol en Gestión de Roles. */
export interface RoleRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    users_count: number;
    permissions: Permission[];
    is_admin: boolean;
    is_base: boolean;
}

/** Permiso del catálogo, con su nombre y descripción para la pantalla. */
export interface PermissionRow {
    slug: Permission;
    name: string;
    description: string | null;
}

/** Rol para el selector de Gestión de Usuarios. */
export interface RoleOption {
    slug: string;
    name: string;
}
