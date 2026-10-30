import { Plus, Trash2, UserRound, Users, X } from 'lucide-react';
import { PanelTitle } from '@/components/headings';
import { IconButton } from '@/components/icon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Invitado, Traducciones } from '@/types/encuentros';

export interface InvitadoForm {
    id: string | null;
    nombre: string;
    titulo: string;
    grupo: string;
    ciudad: string;
    bio: string;
    foto: File | null;
    quitar_foto: 0 | 1;
    traducciones: Traducciones;
    /** Solo para mostrar: la foto guardada o la recién elegida. */
    preview: string | null;
}

export const toInvitadoForm = (
    i: Invitado & { foto_url: string | null; traducciones: Traducciones },
): InvitadoForm => ({
    id: i.id,
    nombre: i.nombre,
    titulo: i.titulo ?? '',
    grupo: i.grupo ?? '',
    ciudad: i.ciudad ?? '',
    bio: i.bio ?? '',
    foto: null,
    quitar_foto: 0,
    preview: i.foto_url,
    traducciones: i.traducciones,
});

/** Lo que viaja al servidor (sin la vista previa). */
export const invitadoPayload = (invitado: InvitadoForm) => {
    const { preview, ...rest } = invitado;
    void preview;

    return rest;
};

/** Invitados del encuentro en el formulario, con foto opcional. */
export function InvitadosEditor({
    invitados,
    onChange,
}: {
    invitados: InvitadoForm[];
    onChange: (invitados: InvitadoForm[]) => void;
}) {
    const update = (i: number, values: Partial<InvitadoForm>) =>
        onChange(
            invitados.map((inv, idx) =>
                idx === i ? { ...inv, ...values } : inv,
            ),
        );

    return (
        <section className="space-y-4 panel p-5">
            <div>
                <PanelTitle icon={Users}>Invitados (opcional)</PanelTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                    Mestres, profesores y demás invitados, con su foto.
                </p>
            </div>
            {invitados.map((inv, i) => (
                <div
                    key={inv.id ?? `nuevo-${i}`}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[6rem_1fr_auto]"
                >
                    <div className="flex flex-col items-center gap-1">
                        <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-secondary/40 transition-colors hover:border-primary">
                            {inv.preview ? (
                                <img
                                    src={inv.preview}
                                    alt={`Foto de ${inv.nombre || 'el invitado'}`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <UserRound className="h-8 w-8 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                                Elegir foto del invitado {i + 1}
                            </span>
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file) {
                                        update(i, {
                                            foto: file,
                                            quitar_foto: 0,
                                            preview: URL.createObjectURL(file),
                                        });
                                    }
                                }}
                            />
                        </label>
                        {inv.preview ? (
                            <button
                                type="button"
                                onClick={() =>
                                    update(i, {
                                        foto: null,
                                        quitar_foto: 1,
                                        preview: null,
                                    })
                                }
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                                Quitar foto
                            </button>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                Foto (opcional)
                            </span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
                            <Input
                                aria-label={`Nombre del invitado ${i + 1}`}
                                value={inv.nombre}
                                onChange={(e) =>
                                    update(i, { nombre: e.target.value })
                                }
                                required
                                maxLength={120}
                                placeholder="Nombre o apelido"
                            />
                            <Input
                                aria-label={`Título del invitado ${i + 1}`}
                                value={inv.titulo}
                                onChange={(e) =>
                                    update(i, { titulo: e.target.value })
                                }
                                maxLength={60}
                                placeholder="Ej.: Mestre"
                            />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                                aria-label={`Grupo del invitado ${i + 1}`}
                                value={inv.grupo}
                                onChange={(e) =>
                                    update(i, { grupo: e.target.value })
                                }
                                maxLength={120}
                                placeholder="Grupo (opcional)"
                            />
                            <Input
                                aria-label={`Ciudad del invitado ${i + 1}`}
                                value={inv.ciudad}
                                onChange={(e) =>
                                    update(i, { ciudad: e.target.value })
                                }
                                maxLength={80}
                                placeholder="Ciudad (opcional)"
                            />
                        </div>
                        <Textarea
                            aria-label={`Reseña del invitado ${i + 1}`}
                            value={inv.bio}
                            onChange={(e) => update(i, { bio: e.target.value })}
                            rows={3}
                            maxLength={1500}
                            placeholder="Reseña (opcional): trayectoria, qué va a dictar…"
                        />
                    </div>
                    <IconButton
                        icon={Trash2}
                        label={`Quitar al invitado ${i + 1}`}
                        tone="destructive"
                        onClick={() =>
                            onChange(invitados.filter((_, idx) => idx !== i))
                        }
                        className="self-start"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                    onChange([
                        ...invitados,
                        {
                            id: null,
                            nombre: '',
                            titulo: '',
                            grupo: '',
                            ciudad: '',
                            bio: '',
                            foto: null,
                            quitar_foto: 0,
                            preview: null,
                            traducciones: null,
                        },
                    ])
                }
            >
                <Plus className="h-4 w-4" />
                Agregar invitado
            </Button>
        </section>
    );
}
