import { router, useForm } from '@inertiajs/react';
import { ExternalLink, FlaskConical, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FlashMessage } from '@/components/flash-message';
import { FormError } from '@/components/form-error';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Estado = 'pendiente' | 'creado' | 'error';

interface EventoRow {
    id: string;
    nombre: string;
    slug: string;
    estado: Estado;
    subdominio_url: string;
    respaldo_url: string;
    mensaje_api: string | null;
    created_at: string;
}

const ESTADOS: Record<Estado, { label: string; className: string }> = {
    pendiente: {
        label: 'Pendiente',
        className: 'bg-secondary text-secondary-foreground',
    },
    creado: { label: 'Creado', className: 'bg-primary/20 text-foreground' },
    error: { label: 'Error', className: 'bg-destructive/15 text-destructive' },
};

/** Prueba de concepto: crear subdominios {slug}.dominio con la API de Hostinger. */
export default function AdminEventosPruebaPage({
    eventos,
    dominio,
    configurado,
}: {
    eventos: EventoRow[];
    dominio: string;
    configurado: boolean;
}) {
    const { confirm } = useConfirm();
    const form = useForm({ nombre: '' });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post('/admin/eventos-prueba', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    const handleDelete = async (ev: EventoRow) => {
        const ok = await confirm({
            title: `¿Eliminar "${ev.nombre}"?`,
            description:
                ev.estado === 'creado'
                    ? `Se eliminará el subdominio ${ev.slug}.${dominio} en Hostinger y el registro.`
                    : 'El subdominio no llegó a crearse: solo se borra el registro.',
            confirmLabel: 'Eliminar subdominio',
            destructive: true,
        });

        if (!ok) {
            return;
        }

        router.delete(`/admin/eventos-prueba/${ev.id}`, {
            preserveScroll: true,
        });
    };

    return (
        <PageLayout
            title="Eventos de prueba"
            width="medium"
            header={
                <PageHeader
                    icon={FlaskConical}
                    title="Eventos de prueba"
                    description={
                        <>
                            Cada evento crea su subdominio{' '}
                            <span className="font-mono text-base">
                                nombre.{dominio}
                            </span>{' '}
                            en Hostinger
                        </>
                    }
                />
            }
        >
            {!configurado && (
                <p
                    role="alert"
                    className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                >
                    Faltan las variables HOSTINGER_API_TOKEN y/o
                    HOSTINGER_USERNAME en el .env: la API no se va a llamar.
                </p>
            )}

            <FlashMessage className="mb-6" />

            <form onSubmit={handleSubmit} className="mb-8 space-y-2 panel p-5">
                <Label htmlFor="nombre">Nombre del evento</Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        id="nombre"
                        value={form.data.nombre}
                        onChange={(e) => form.setData('nombre', e.target.value)}
                        required
                        maxLength={255}
                        disabled={form.processing}
                        placeholder="Ej.: Batizado 2027"
                    />
                    <SubmitButton
                        processing={form.processing}
                        pendingLabel="Creando…"
                        className="shrink-0"
                    >
                        Crear evento
                    </SubmitButton>
                </div>
                <FormError message={form.errors.nombre} />
            </form>

            {eventos.length === 0 ? (
                <EmptyState icon={FlaskConical}>
                    Todavía no hay eventos de prueba.
                </EmptyState>
            ) : (
                <div className="space-y-3">
                    {eventos.map((ev) => (
                        <div
                            key={ev.id}
                            className="flex items-start gap-4 panel p-5"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-serif font-bold text-foreground">
                                        {ev.nombre}
                                    </span>
                                    <span
                                        className={cn(
                                            'rounded px-2 py-0.5 text-xs font-medium',
                                            ESTADOS[ev.estado].className,
                                        )}
                                    >
                                        {ESTADOS[ev.estado].label}
                                    </span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                    <a
                                        href={ev.subdominio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                                    >
                                        {ev.subdominio_url.replace(
                                            'https://',
                                            '',
                                        )}
                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                    <a
                                        href={ev.respaldo_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        Ver sin subdominio
                                    </a>
                                </div>
                                {ev.mensaje_api && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Hostinger: {ev.mensaje_api}
                                    </p>
                                )}
                            </div>
                            <IconButton
                                icon={Trash2}
                                label={`Eliminar subdominio de ${ev.nombre}`}
                                tone="destructive"
                                onClick={() => handleDelete(ev)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </PageLayout>
    );
}
