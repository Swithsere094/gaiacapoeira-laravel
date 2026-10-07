import { router, usePage } from '@inertiajs/react';
import { useCallback } from 'react';

/**
 * Usuario con sesión. Misma interfaz que el `useAuth()` del sitio Next, pero
 * el usuario ya viene en las props compartidas de Inertia (lo pone
 * HandleInertiaRequests en cada respuesta): no hay que pedirlo a una API,
 * así que nunca está "cargando".
 */
export function useAuth() {
    const { auth } = usePage().props;

    const signOut = useCallback(() => {
        router.post('/auth/logout');
    }, []);

    return { user: auth.user, loading: false, signOut };
}
