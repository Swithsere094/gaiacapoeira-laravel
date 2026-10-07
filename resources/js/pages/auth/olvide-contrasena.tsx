import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Copy, KeyRound, Mail, User } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OlvideContrasena() {
    const { flash } = usePage().props;
    const tempPassword = flash.tempPassword ?? '';
    const form = useForm({ username: '', email: '' });
    const [copied, setCopied] = useState(false);
    const error = form.errors.username ?? form.errors.email;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({ username: data.username.trim(), email: data.email.trim() }));
        form.post('/auth/olvide-contrasena');
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Sin permiso de portapapeles: la contraseña sigue visible para copiarla a mano.
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Recuperar contraseña" />
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <KeyRound className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="font-serif text-2xl text-foreground">
                        <h1>Recuperar contraseña</h1>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Ingresa tu usuario y el email registrado en tu cuenta
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {tempPassword ? (
                        <div className="space-y-5">
                            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/10 p-5 text-center">
                                <CheckCircle className="mx-auto h-10 w-10 text-primary" />
                                <p className="font-semibold text-foreground">¡Contraseña generada!</p>
                                <p className="text-sm text-muted-foreground">
                                    Esta es tu contraseña temporal. Úsala para iniciar sesión y cámbiala desde tu perfil.
                                </p>

                                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3">
                                    <code className="flex-1 text-center font-mono text-lg font-bold tracking-widest text-foreground">
                                        {tempPassword}
                                    </code>
                                    <button
                                        type="button"
                                        onClick={copyToClipboard}
                                        className="text-muted-foreground transition-colors hover:text-primary"
                                        aria-label="Copiar contraseña"
                                    >
                                        {copied ? <CheckCircle className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                                    </button>
                                </div>

                                <p className="text-xs text-muted-foreground">Guarda esta contraseña antes de cerrar esta página.</p>
                            </div>

                            <Button asChild className="w-full">
                                <Link href="/auth/login">Ir al inicio de sesión</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuario</Label>
                                <div className="relative">
                                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="tu-usuario"
                                        value={form.data.username}
                                        onChange={(e) => form.setData('username', e.target.value)}
                                        className="pl-9"
                                        required
                                        disabled={form.processing}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email registrado</Label>
                                <div className="relative">
                                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="tu@email.com"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        className="pl-9"
                                        required
                                        disabled={form.processing}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Debe coincidir con el email que el administrador registró en tu cuenta.
                                </p>
                            </div>

                            {error && (
                                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    {error}
                                </p>
                            )}

                            <Button type="submit" className="w-full" disabled={form.processing}>
                                {form.processing ? 'Verificando...' : 'Generar contraseña temporal'}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/auth/login"
                                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
