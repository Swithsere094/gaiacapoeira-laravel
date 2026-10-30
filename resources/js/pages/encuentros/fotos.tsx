import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, Images, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FlashMessage } from '@/components/flash-message';
import { FormError } from '@/components/form-error';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';

interface Foto {
    id: string;
    miniatura: string;
    foto: string;
}

/**
 * Fotos del encuentro para la página de recuerdo. Se pueden elegir muchas a
 * la vez: se suben por tandas de `porTanda` (PHP acepta pocos archivos por
 * petición) y el servidor las achica.
 */
export default function EncuentroFotosPage({
    encuentro,
    fotos,
    porTanda,
}: {
    encuentro: { id: string; nombre: string; estado: string };
    fotos: Foto[];
    porTanda: number;
}) {
    const { confirm } = useConfirm();
    const errors = usePage().props.errors as Record<string, string>;
    const [progreso, setProgreso] = useState<{
        hechas: number;
        total: number;
    } | null>(null);
    const base = `/encuentros/${encuentro.id}/fotos`;

    const subir = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (files.length === 0) {
            return;
        }

        setProgreso({ hechas: 0, total: files.length });
        for (let i = 0; i < files.length; i += porTanda) {
            const tanda = files.slice(i, i + porTanda);
            const ok = await new Promise<boolean>((resolve) =>
                router.post(
                    base,
                    { fotos: tanda },
                    {
                        forceFormData: true,
                        preserveScroll: true,
                        onSuccess: (page) =>
                            resolve(
                                Object.keys(page.props.errors ?? {}).length ===
                                    0,
                            ),
                        onError: () => resolve(false),
                    },
                ),
            );
            if (!ok) {
                break;
            }
            setProgreso({
                hechas: Math.min(i + porTanda, files.length),
                total: files.length,
            });
        }
        setProgreso(null);
    };

    const eliminar = async (foto: Foto) => {
        const ok = await confirm({
            title: '¿Eliminar esta foto?',
            description: 'Deja de verse en la página del encuentro.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (ok) {
            router.delete(`${base}/${foto.id}`, { preserveScroll: true });
        }
    };

    return (
        <PageLayout
            title={`Fotos · ${encuentro.nombre}`}
            width="medium"
            className="space-y-4"
            header={
                <PageHeader
                    icon={Images}
                    title="Fotos"
                    description={`${encuentro.nombre} · se ven en la página cuando el encuentro está terminado`}
                />
            }
        >
            <Link
                href={`/encuentros/${encuentro.id}`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver al encuentro
            </Link>

            <FlashMessage />

            <label
                className={
                    progreso
                        ? 'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary p-6 text-sm text-foreground'
                        : 'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground'
                }
            >
                <ImagePlus className="h-7 w-7" />
                {progreso ? (
                    <span aria-live="polite">
                        Subiendo fotos… {progreso.hechas} de {progreso.total}
                    </span>
                ) : (
                    <>
                        <span className="font-medium">Agregar fotos</span>
                        <span className="text-xs">
                            Puedes elegir varias a la vez (JPG, PNG o WEBP, máx.
                            20 MB cada una). Se achican solas.
                        </span>
                    </>
                )}
                <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    disabled={progreso !== null}
                    onChange={(e) => void subir(e)}
                />
            </label>

            <FormError message={Object.values(errors ?? {})[0]} />

            {fotos.length === 0 ? (
                <EmptyState icon={Images}>Todavía no hay fotos.</EmptyState>
            ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {fotos.map((f) => (
                        <li
                            key={f.id}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                        >
                            <a href={f.foto} target="_blank" rel="noreferrer">
                                <img
                                    src={f.miniatura}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                />
                            </a>
                            <IconButton
                                icon={Trash2}
                                label="Eliminar foto"
                                tone="destructive"
                                onClick={() => void eliminar(f)}
                                className="absolute top-2 right-2 bg-background/80 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:hover)]:opacity-0"
                            />
                        </li>
                    ))}
                </ul>
            )}
        </PageLayout>
    );
}
