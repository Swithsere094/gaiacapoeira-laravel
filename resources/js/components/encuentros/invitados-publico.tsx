import { UserRound, Users } from 'lucide-react';
import { PanelTitle } from '@/components/headings';
import type { Invitado } from '@/types/encuentros';

/** Invitados en la página pública: tarjeta con foto, título y reseña. */
export function InvitadosPublico({
    invitados,
}: {
    invitados: (Invitado & { foto: string | null })[];
}) {
    if (invitados.length === 0) {
        return null;
    }

    return (
        <section className="space-y-3">
            <PanelTitle icon={Users}>Invitados</PanelTitle>
            <ul className="grid gap-4 sm:grid-cols-2">
                {invitados.map((inv) => {
                    const detalle = [inv.grupo, inv.ciudad]
                        .filter(Boolean)
                        .join(' · ');

                    return (
                        <li key={inv.id} className="flex gap-4 panel p-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/50 bg-secondary/40">
                                {inv.foto ? (
                                    <img
                                        src={inv.foto}
                                        alt={`Foto de ${inv.nombre}`}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserRound className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>
                            <div className="min-w-0">
                                {inv.titulo && (
                                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                                        {inv.titulo}
                                    </p>
                                )}
                                <p className="font-serif text-lg font-bold text-foreground">
                                    {inv.nombre}
                                </p>
                                {detalle && (
                                    <p className="text-sm text-muted-foreground">
                                        {detalle}
                                    </p>
                                )}
                                {inv.bio && (
                                    <p className="mt-2 text-sm whitespace-pre-line text-foreground">
                                        {inv.bio}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
