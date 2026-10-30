import { Link } from '@inertiajs/react';
import { MapPin, Plus, Ticket, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { FlashMessage } from '@/components/flash-message';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { ESTADO_CLASSES, ESTADO_LABELS, formatRange } from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { EncuentroEstado } from '@/types/encuentros';

interface EncuentroRow {
    id: string;
    nombre: string;
    slug: string;
    starts_on: string;
    ends_on: string | null;
    lugar: string | null;
    estado: EncuentroEstado;
    inscritos: number;
    cupo: number | null;
}

/** Encuentros (batizados…) con su página de inscripción. */
export default function EncuentrosPage({
    encuentros,
}: {
    encuentros: EncuentroRow[];
}) {
    return (
        <PageLayout
            title="Encuentros"
            width="medium"
            header={
                <PageHeader
                    icon={Ticket}
                    title="Encuentros"
                    description="Batizados y encuentros del grupo, con su página de inscripción"
                    actions={
                        <Button asChild className="gap-2">
                            <Link href="/encuentros/nuevo">
                                <Plus className="h-4 w-4" />
                                Nuevo encuentro
                            </Link>
                        </Button>
                    }
                />
            }
        >
            <FlashMessage className="mb-6" />

            {encuentros.length === 0 ? (
                <EmptyState icon={Ticket}>
                    Todavía no hay encuentros. Crea el primero y publícalo
                    cuando esté listo.
                </EmptyState>
            ) : (
                <div className="space-y-3">
                    {encuentros.map((e) => (
                        <Link
                            key={e.id}
                            href={`/encuentros/${e.id}`}
                            className="block panel p-5 transition-colors hover:border-primary/60"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-serif text-lg font-bold text-foreground">
                                    {e.nombre}
                                </span>
                                <span
                                    className={cn(
                                        'rounded px-2 py-0.5 text-xs font-medium',
                                        ESTADO_CLASSES[e.estado],
                                    )}
                                >
                                    {ESTADO_LABELS[e.estado]}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {formatRange(e.starts_on, e.ends_on)}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {e.lugar && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3.5 w-3.5" />
                                        {e.lugar}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {e.inscritos}
                                    {e.cupo !== null && ` / ${e.cupo}`}{' '}
                                    inscritos
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </PageLayout>
    );
}
