import { createInertiaApp } from '@inertiajs/react';
import { ConfirmDialogProvider } from '@/components/confirm-dialog';
import { TooltipProvider } from '@/components/ui/tooltip';

const appName = import.meta.env.VITE_APP_NAME || 'Areia no Mar';

/**
 * Las páginas públicas de un encuentro llevan el nombre del grupo, no el del
 * sitio: PublicLayout ya pone este sufijo y acá no se agrega otro.
 */
const PUBLIC_TITLE_SUFFIX = ' - Gaia Capoeira';

// Cada página arma su propio layout (navegación + footer), igual que en el
// sitio original: no hay layout global.
void createInertiaApp({
    title: (title) =>
        !title
            ? appName
            : title.endsWith(PUBLIC_TITLE_SUFFIX)
              ? title
              : `${title} - ${appName}`,
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                <ConfirmDialogProvider>{app}</ConfirmDialogProvider>
            </TooltipProvider>
        );
    },
    progress: {
        color: '#AF9A4F',
    },
});
