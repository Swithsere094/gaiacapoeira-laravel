/**
 * Textos de las páginas de error. Los mismos textos están en las versiones
 * de respaldo en HTML puro (resources/views/errors/*.blade.php), que se usan
 * si la página de React no se puede mostrar.
 */
export interface ErrorCopy {
    title: string;
    message: string;
}

export const ERROR_COPY: Record<number, ErrorCopy> = {
    403: {
        title: 'Sin permisos',
        message:
            'No tienes acceso a esta sección. Si crees que es un error, habla con un administrador del grupo.',
    },
    404: {
        title: 'Página no encontrada',
        message: 'La página que buscas no existe o ya fue eliminada.',
    },
    405: {
        title: 'Acción no permitida',
        message:
            'Esta dirección no admite la acción que intentaste. Vuelve atrás y usa los botones del sitio.',
    },
    413: {
        title: 'Archivo demasiado grande',
        message:
            'El archivo que intentaste subir supera el tamaño permitido (máximo 20 MB).',
    },
    419: {
        title: 'La página expiró',
        message:
            'Tu sesión o el formulario venció por inactividad. Recarga la página e inténtalo de nuevo.',
    },
    429: {
        title: 'Demasiados intentos',
        message:
            'Hiciste demasiadas solicitudes seguidas. Espera un momento y vuelve a intentarlo.',
    },
    500: {
        title: 'Algo salió mal',
        message:
            'Ocurrió un error inesperado en el servidor. Ya quedó registrado; inténtalo de nuevo en unos minutos.',
    },
    503: {
        title: 'Sitio en mantenimiento',
        message:
            'Estamos haciendo mejoras en el sitio. Vuelve en unos minutos.',
    },
};

export function errorCopy(status: number): ErrorCopy {
    return ERROR_COPY[status] ?? ERROR_COPY[500];
}
