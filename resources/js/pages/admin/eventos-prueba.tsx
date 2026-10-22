import { Head, router, useForm } from '@inertiajs/react';
import { ExternalLink, FlaskConical, Loader2, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { FlashMessage } from '@/components/retos/flash-message';
import { Button } from '@/components/ui/button';
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
export default function AdminEventosPrueba({
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
        <div className="min-h-screen bg-background">
            <Head title="Eventos de prueba" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="flex items-center gap-3 font-serif text-3xl font-bold text-foreground">
                            <FlaskConical className="h-8 w-8 text-primary" />
                            Eventos de prueba
                        </h1>
                        <p className="mt-1 text-muted-foreground">
                            Cada evento crea su subdominio{' '}
                            <span className="font-mono text-sm">
                                nombre.{dominio}
                            </span>{' '}
                            en Hostinger
                        </p>
                    </div>

                    {!configurado && (
                        <p
                            role="alert"
                            className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                        >
                            Faltan las variables HOSTINGER_API_TOKEN y/o
                            HOSTINGER_USERNAME en el .env: la API no se va a
                            llamar.
                        </p>
                    )}

                    <FlashMessage className="mb-6" />

                    <form
                        onSubmit={handleSubmit}
                        className="mb-8 space-y-2 rounded-xl bg-card p-5"
                    >
                        <Label htmlFor="nombre">Nombre del evento</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Input
                                id="nombre"
                                value={form.data.nombre}
                                onChange={(e) =>
                                    form.setData('nombre', e.target.value)
                                }
                                required
                                maxLength={255}
                                disabled={form.processing}
                                placeholder="Ej: Batizado 2027"
                            />
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="shrink-0"
                            >
                                {form.processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    'Crear evento'
                                )}
                            </Button>
                        </div>
                        {form.errors.nombre && (
                            <p
                                role="alert"
                                className="text-sm text-destructive"
                            >
                                {form.errors.nombre}
                            </p>
                        )}
                    </form>

                    {eventos.length === 0 ? (
                        <p className="text-center text-muted-foreground">
                            Todavía no hay eventos de prueba.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {eventos.map((ev) => (
                                <div
                                    key={ev.id}
                                    className="flex items-start gap-4 rounded-xl bg-card p-5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-serif font-bold text-foreground">
                                                {ev.nombre}
                                            </span>
                                            <span
                                                className={cn(
                                                    'rounded px-2 py-0.5 text-xs font-medium',
                                                    ESTADOS[ev.estado]
                                                        .className,
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
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(ev)}
                                        className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        aria-label={`Eliminar subdominio de ${ev.nombre}`}
                                        title="Eliminar subdominio"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
