import {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface DialogOptions {
    title: string;
    description?: string;
    /** Texto del botón principal (por defecto "Aceptar"). */
    confirmLabel?: string;
    /** Botón principal en rojo (acciones que borran algo). */
    destructive?: boolean;
}

interface ConfirmApi {
    /** Pregunta con "Cancelar" / botón principal. Resuelve true si confirma. */
    confirm: (options: DialogOptions) => Promise<boolean>;
    /** Aviso con un solo botón ("Entendido"). */
    notify: (options: DialogOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmApi | null>(null);

/**
 * Diálogos de confirmación y aviso con el estilo del sitio, en lugar de
 * `confirm()` / `alert()` del navegador (auditoría P7). Se monta una sola
 * vez en app.tsx y se usa con `useConfirm()`.
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<
        (DialogOptions & { alertOnly: boolean }) | null
    >(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const open = useCallback(
        (next: DialogOptions, alertOnly: boolean) =>
            new Promise<boolean>((resolve) => {
                resolver.current = resolve;
                setOptions({ ...next, alertOnly });
            }),
        [],
    );

    const confirm = useCallback(
        (next: DialogOptions) => open(next, false),
        [open],
    );
    const notify = useCallback(
        async (next: DialogOptions) => {
            await open(next, true);
        },
        [open],
    );

    const close = (value: boolean) => {
        resolver.current?.(value);
        resolver.current = null;
        setOptions(null);
    };

    return (
        <ConfirmContext.Provider value={{ confirm, notify }}>
            {children}
            <Dialog
                open={options !== null}
                onOpenChange={(isOpen) => {
                    if (!isOpen) close(false);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {options?.title}
                        </DialogTitle>
                        {options?.description && (
                            <DialogDescription>
                                {options.description}
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        {options?.alertOnly ? (
                            <Button onClick={() => close(true)} autoFocus>
                                Entendido
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => close(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant={
                                        options?.destructive
                                            ? 'destructive'
                                            : 'default'
                                    }
                                    onClick={() => close(true)}
                                    autoFocus
                                >
                                    {options?.confirmLabel ?? 'Aceptar'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmApi {
    const api = useContext(ConfirmContext);

    if (!api) {
        throw new Error(
            'useConfirm() necesita <ConfirmDialogProvider> (app.tsx).',
        );
    }

    return api;
}
