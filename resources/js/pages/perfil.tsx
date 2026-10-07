import { Head, router, useForm } from '@inertiajs/react';
import { Award, CheckCircle, Eye, EyeOff, Loader2, User } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { CORDAS, getCordaSrc } from '@/lib/constants/cordas';

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    member: 'Miembro',
};

/** Muestra un aviso de "guardado" por unos segundos. */
function useFlag(ms: number) {
    const [on, setOn] = useState(false);
    const flash = () => {
        setOn(true);
        setTimeout(() => setOn(false), ms);
    };

    return [on, flash] as const;
}

export default function Perfil() {
    const { user } = useAuth();

    // ── Avatar (cuerda) ────────────────────────────────────────────────
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
        user?.avatar ?? null,
    );
    const [avatarSaved, flashAvatarSaved] = useFlag(3000);
    const [avatarError, setAvatarError] = useState('');

    // ── Apodo ──────────────────────────────────────────────────────────
    const apodoForm = useForm({ apodo: user?.apodo ?? '' });
    const [savedApodo, flashSavedApodo] = useFlag(3000);

    // ── Contraseña ─────────────────────────────────────────────────────
    const passForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [savedPass, flashSavedPass] = useFlag(4000);
    const [passError, setPassError] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    if (!user) {
        return null;
    }

    const handleSelectAvatar = (id: string) => {
        setSelectedAvatar(id);
        setAvatarError('');
        router.put(
            '/perfil/avatar',
            { avatar: id },
            {
                preserveScroll: true,
                onSuccess: () => flashAvatarSaved(),
                onError: () => {
                    setAvatarError('Error al guardar');
                    setTimeout(() => setAvatarError(''), 3000);
                },
            },
        );
    };

    const handleSaveApodo = (e: FormEvent) => {
        e.preventDefault();
        apodoForm.put('/perfil/apodo', {
            preserveScroll: true,
            onSuccess: () => flashSavedApodo(),
        });
    };

    const handleChangePassword = (e: FormEvent) => {
        e.preventDefault();
        setPassError('');

        if (passForm.data.password.length < 6) {
            setPassError(
                'La nueva contraseña debe tener al menos 6 caracteres',
            );

            return;
        }

        if (passForm.data.password !== passForm.data.password_confirmation) {
            setPassError('Las contraseñas no coinciden');

            return;
        }

        passForm.put('/perfil/password', {
            preserveScroll: true,
            onSuccess: () => {
                passForm.reset();
                flashSavedPass();
            },
        });
    };

    const passServerError =
        passForm.errors.current_password ?? passForm.errors.password;

    return (
        <div className="min-h-screen bg-background">
            <Head title="Mi Perfil" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {/* ── Info card ── */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border pb-6 text-center">
                            <div className="mb-4 flex justify-center">
                                {selectedAvatar ? (
                                    <img
                                        src={getCordaSrc(selectedAvatar)!}
                                        alt="Tu cuerda"
                                        className="h-28 w-28 object-contain drop-shadow-lg"
                                    />
                                ) : (
                                    <div className="flex h-28 w-28 items-center justify-center">
                                        <User className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <h1 className="font-serif text-2xl leading-none font-semibold text-foreground">
                                {user.name}
                                {user.apodo && (
                                    <span className="mt-1 block text-lg font-normal text-muted-foreground italic">
                                        «{user.apodo}»
                                    </span>
                                )}
                            </h1>
                            <div className="mt-2 flex items-center justify-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                <span className="font-medium text-primary">
                                    {ROLE_LABELS[user.role] ?? user.role}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="grid gap-4 text-sm sm:grid-cols-2">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Usuario
                                    </p>
                                    <p className="text-foreground">
                                        @{user.username}
                                    </p>
                                </div>
                                {user.email && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Email
                                        </p>
                                        <p className="text-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Elegir cuerda ── */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border pb-4">
                            <h2 className="font-serif text-lg leading-none font-semibold text-foreground">
                                Tu cuerda
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Elige la cuerda que te identifica.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                {CORDAS.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectAvatar(c.id)}
                                        title={c.label}
                                        aria-pressed={selectedAvatar === c.id}
                                        className={`flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition-all focus:outline-none ${
                                            selectedAvatar === c.id
                                                ? 'bg-primary/10'
                                                : 'hover:bg-secondary'
                                        }`}
                                    >
                                        <div
                                            className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 transition-all ${
                                                selectedAvatar === c.id
                                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                    : 'border-transparent hover:border-primary/40'
                                            }`}
                                        >
                                            {/* Los PNG tienen mucho margen transparente y el dibujo no
                                                está centrado: translateY primero, después scale (ver CLAUDE.md).
                                                alt="" porque el <span> de abajo ya nombra el botón. */}
                                            <img
                                                src={`/Cuerda x cuerda/${c.id}.png`}
                                                alt=""
                                                className="h-full w-full object-contain"
                                                style={{
                                                    transform:
                                                        'translateY(9.6%) scale(1.8)',
                                                }}
                                            />
                                        </div>
                                        <span className="text-center text-[11px] leading-tight text-muted-foreground">
                                            {c.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {avatarSaved && (
                                <p className="mt-4 flex items-center justify-center gap-1 text-center text-sm text-primary">
                                    <CheckCircle className="h-4 w-4" /> ¡Cuerda
                                    guardada!
                                </p>
                            )}
                            {avatarError && (
                                <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                                    {avatarError}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Editar apodo ── */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border pb-4">
                            <h2 className="font-serif text-lg leading-none font-semibold text-foreground">
                                Apodo
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Tu nombre de capoeira aparecerá en tu perfil.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form
                                onSubmit={handleSaveApodo}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="apodo">
                                        Apodo (opcional)
                                    </Label>
                                    <Input
                                        id="apodo"
                                        value={apodoForm.data.apodo}
                                        onChange={(e) =>
                                            apodoForm.setData(
                                                'apodo',
                                                e.target.value,
                                            )
                                        }
                                        disabled={apodoForm.processing}
                                        placeholder="Ej: Mariposa do Mar"
                                        maxLength={60}
                                    />
                                </div>
                                {apodoForm.errors.apodo && (
                                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                        {apodoForm.errors.apodo}
                                    </p>
                                )}
                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={apodoForm.processing}
                                    >
                                        {apodoForm.processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            'Guardar apodo'
                                        )}
                                    </Button>
                                    {savedApodo && (
                                        <span className="flex items-center gap-1 text-sm text-primary">
                                            <CheckCircle className="h-4 w-4" />
                                            ¡Guardado!
                                        </span>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* ── Cambiar contraseña ── */}
                    <Card className="border-border bg-card">
                        <CardHeader className="border-b border-border pb-4">
                            <h2 className="font-serif text-lg leading-none font-semibold text-foreground">
                                Cambiar contraseña
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Necesitas tu contraseña actual para establecer
                                una nueva.
                            </p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form
                                onSubmit={handleChangePassword}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="current-pass">
                                        Contraseña actual
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current-pass"
                                            type={
                                                showCurrent
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={
                                                passForm.data.current_password
                                            }
                                            onChange={(e) =>
                                                passForm.setData(
                                                    'current_password',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={passForm.processing}
                                            placeholder="Tu contraseña actual"
                                            required
                                            autoComplete="current-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowCurrent((v) => !v)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={
                                                showCurrent
                                                    ? 'Ocultar contraseña'
                                                    : 'Mostrar contraseña'
                                            }
                                        >
                                            {showCurrent ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-pass">
                                        Nueva contraseña
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="new-pass"
                                            type={showNew ? 'text' : 'password'}
                                            value={passForm.data.password}
                                            onChange={(e) =>
                                                passForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={passForm.processing}
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            autoComplete="new-password"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowNew((v) => !v)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label={
                                                showNew
                                                    ? 'Ocultar contraseña'
                                                    : 'Mostrar contraseña'
                                            }
                                        >
                                            {showNew ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-pass">
                                        Confirmar nueva contraseña
                                    </Label>
                                    <Input
                                        id="confirm-pass"
                                        type="password"
                                        value={
                                            passForm.data.password_confirmation
                                        }
                                        onChange={(e) =>
                                            passForm.setData(
                                                'password_confirmation',
                                                e.target.value,
                                            )
                                        }
                                        disabled={passForm.processing}
                                        placeholder="Repite la nueva contraseña"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>

                                {(passError || passServerError) && (
                                    <p
                                        role="alert"
                                        className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                                    >
                                        {passError || passServerError}
                                    </p>
                                )}

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="submit"
                                        disabled={passForm.processing}
                                    >
                                        {passForm.processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            'Cambiar contraseña'
                                        )}
                                    </Button>
                                    {savedPass && (
                                        <span className="flex items-center gap-1 text-sm text-primary">
                                            <CheckCircle className="h-4 w-4" />
                                            ¡Contraseña actualizada!
                                        </span>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
}
