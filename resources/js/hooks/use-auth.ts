import { router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';
import type { Permission } from '@/types';

/**
 * Usuario con sesión. Misma interfaz que el `useAuth()` del sitio Next, pero
 * el usuario ya viene en las props compartidas de Inertia (lo pone
 * HandleInertiaRequests en cada respuesta): no hay que pedirlo a una API,
 * así que nunca está "cargando".
 *
 * `can(permiso)` dice si mostrar un botón; el servidor lo vuelve a comprobar.
 * `isAdmin` es para lo que no es un permiso (usuarios y roles).
 */
export function useAuth() {
    const { auth } = usePage().props;

    const signOut = useCallback(() => {
        router.post('/auth/logout');
    }, []);

    const can = useCallback(
        (permission: Permission) => auth.permissions.includes(permission),
        [auth.permissions],
    );

    return {
        user: auth.user,
        loading: false,
        signOut,
        can,
        isAdmin: auth.user?.role === 'admin',
    };
}
