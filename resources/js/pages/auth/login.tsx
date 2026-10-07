import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, User } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
    const form = useForm({ username: '', password: '' });
    const error = form.errors.username ?? form.errors.password;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Si la sesión había vencido, Laravel vuelve a la página que se
        // intentó abrir (redirect()->intended), como el ?next= del sitio Next.
        form.post('/auth/login', { onFinish: () => form.reset('password') });
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-4">
            <Head title="Iniciar sesión" />
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    {/* CardTitle renderiza un <div>: la página necesita un <h1> real. */}
                    <h1 className="font-serif text-2xl leading-none font-semibold text-foreground">Areia no Mar</h1>
                    <CardDescription className="text-muted-foreground">
                        Ingresa tus credenciales para acceder al repositorio
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-foreground">
                                Usuario
                            </Label>
                            <div className="relative">
                                <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="tu-usuario"
                                    value={form.data.username}
                                    onChange={(e) => form.setData('username', e.target.value)}
                                    className="border-border bg-input pl-9 text-foreground"
                                    required
                                    disabled={form.processing}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">
                                Contraseña
                            </Label>
                            <div className="relative">
                                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    className="border-border bg-input pl-9 text-foreground"
                                    required
                                    disabled={form.processing}
                                />
                            </div>
                        </div>

                        {error && (
                            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                                {error}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            disabled={form.processing}
                        >
                            {form.processing ? 'Entrando...' : 'Entrar'}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/auth/olvide-contrasena"
                                className="text-sm text-muted-foreground transition-colors hover:text-primary"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
