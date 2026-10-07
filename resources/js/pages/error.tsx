import { Head } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Ban, Clock, FileWarning, Home, Lock, RefreshCw, SearchX, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { errorCopy } from '@/lib/errors';

const ICONS: Record<number, LucideIcon> = {
    403: Lock,
    404: SearchX,
    405: Ban,
    413: FileWarning,
    419: Clock,
    429: Clock,
    500: AlertTriangle,
    503: Wrench,
};

/**
 * Página de error con el estilo del sitio (misma tarjeta centrada que el
 * login). Es autónoma a propósito: no usa la navegación ni el usuario de la
 * sesión, porque en algunos errores (ej. un 404 de una dirección que no
 * existe) Laravel responde sin haber abierto la sesión.
 */
export default function ErrorPage({ status }: { status: number }) {
    const { title, message } = errorCopy(status);
    const Icon = ICONS[status] ?? AlertTriangle;
    // En 419 (sesión/formulario vencido) y 503 (mantenimiento) lo útil es
    // recargar; en el resto, volver atrás o al inicio.
    const offerReload = status === 419 || status === 503;

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title={title} />
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
                    </div>
                    <p className="font-serif text-5xl font-bold text-primary" aria-hidden="true">
                        {status}
                    </p>
                    <h1 className="font-serif text-2xl leading-none font-semibold text-foreground">{title}</h1>
                    <CardDescription className="text-base text-muted-foreground">{message}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    {offerReload ? (
                        <Button onClick={() => window.location.reload()} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Recargar la página
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Volver atrás
                        </Button>
                    )}
                    {/* <a> normal (no <Link> de Inertia): un error puede venir de un
                        estado roto, una carga completa de la página lo limpia. */}
                    <Button asChild variant={offerReload ? 'outline' : 'default'} className="gap-2">
                        <a href="/">
                            <Home className="h-4 w-4" />
                            Ir al inicio
                        </a>
                    </Button>
                </CardContent>
            </Card>
        </main>
    );
}
