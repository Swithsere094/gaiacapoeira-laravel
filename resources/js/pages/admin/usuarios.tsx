import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle,
    Copy,
    Eye,
    EyeOff,
    Loader2,
    Pencil,
    Plus,
    ShieldCheck,
    Shuffle,
    Trash2,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/types';

function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

const EMPTY_FORM = {
    username: '',
    name: '',
    email: '',
    role: 'member' as 'admin' | 'member',
    apodo: '',
    password: '',
    passwordConfirm: '',
};

const roleLabels = { admin: 'Administrador', member: 'Miembro' };
// text-foreground (no text-primary): bg-primary/20 + text-primary no cumple
// el contraste mínimo de WCAG AA.
const roleColors = {
    admin: 'bg-primary/20 text-foreground',
    member: 'bg-secondary text-secondary-foreground',
};

export default function AdminUsuarios({ users }: { users: AppUser[] }) {
    const { user } = useAuth();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const form = useForm(EMPTY_FORM);
    const [clientError, setClientError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    if (!user) {
        return null;
    }

    const openAdd = () => {
        setEditingUser(null);
        form.setData(EMPTY_FORM);
        form.clearErrors();
        setClientError('');
        setShowPassword(false);
        setCopiedPassword(false);
        setDialogOpen(true);
    };

    const openEdit = (u: AppUser) => {
        setEditingUser(u);
        form.setData({
            username: u.username,
            name: u.name,
            email: u.email ?? '',
            role: u.role,
            apodo: u.apodo ?? '',
            password: '',
            passwordConfirm: '',
        });
        form.clearErrors();
        setClientError('');
        setShowPassword(false);
        setCopiedPassword(false);
        setDialogOpen(true);
    };

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setClientError('');
        const { data } = form;

        if (!editingUser && !data.password) {
            setClientError('La contraseña es obligatoria para nuevos usuarios');

            return;
        }

        if (data.password && data.password !== data.passwordConfirm) {
            setClientError('Las contraseñas no coinciden');

            return;
        }

        if (data.password && data.password.length < 6) {
            setClientError('La contraseña debe tener al menos 6 caracteres');

            return;
        }

        form.transform((d) => ({
            ...(editingUser ? {} : { username: d.username }),
            name: d.name,
            email: d.email || null,
            role: d.role,
            apodo: d.apodo || null,
            ...(d.password ? { password: d.password } : {}),
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
        };

        if (editingUser) {
            form.put(`/admin/usuarios/${editingUser.id}`, options);
        } else {
            form.post('/admin/usuarios', options);
        }
    };

    const handleDelete = (u: AppUser) => {
        if (u.id === user.id) {
            alert('No puedes eliminarte a ti mismo.');

            return;
        }

        if (!confirm(`¿Eliminar al usuario "${u.name}"?`)) {
            return;
        }

        router.delete(`/admin/usuarios/${u.id}`, {
            preserveScroll: true,
            onError: (errors) =>
                alert(errors.user ?? 'No se pudo eliminar el usuario.'),
        });
    };

    const formError = clientError || Object.values(form.errors)[0];

    return (
        <div className="min-h-screen bg-background">
            <Head title="Gestión de Usuarios" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center gap-3 font-serif text-3xl font-bold text-foreground">
                                <Users className="h-8 w-8 text-primary" />
                                Gestión de Usuarios
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Crea, edita y elimina los usuarios del grupo
                            </p>
                        </div>
                        <Button onClick={openAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo usuario
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {users.map((u) => (
                            <div
                                key={u.id}
                                className="flex items-center gap-4 rounded-xl bg-card p-5"
                            >
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                    {u.role === 'admin' ? (
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                    ) : (
                                        <User className="h-6 w-6 text-primary" />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-serif font-bold text-foreground">
                                            {u.name}
                                        </span>
                                        {u.apodo && (
                                            <span className="text-sm text-muted-foreground italic">
                                                «{u.apodo}»
                                            </span>
                                        )}
                                        <span
                                            className={cn(
                                                'rounded px-2 py-0.5 text-xs font-medium',
                                                roleColors[u.role],
                                            )}
                                        >
                                            {roleLabels[u.role]}
                                        </span>
                                        {u.id === user.id && (
                                            <span className="text-xs text-muted-foreground">
                                                (tú)
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        @{u.username}
                                        {u.email && <span> · {u.email}</span>}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => openEdit(u)}
                                        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                        aria-label={`Editar a ${u.name}`}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    {u.id !== user.id && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(u)}
                                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            aria-label={`Eliminar a ${u.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="mt-2 space-y-4">
                        {!editingUser && (
                            <div className="space-y-2">
                                <Label htmlFor="username">Usuario *</Label>
                                <Input
                                    id="username"
                                    value={form.data.username}
                                    onChange={(e) =>
                                        form.setData(
                                            'username',
                                            e.target.value
                                                .toLowerCase()
                                                .replace(/\s/g, ''),
                                        )
                                    }
                                    required
                                    disabled={form.processing}
                                    placeholder="sin espacios, ej: mariabatizado"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo *</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                                disabled={form.processing}
                                placeholder="Ej: María García"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apodo">Apodo (opcional)</Label>
                            <Input
                                id="apodo"
                                value={form.data.apodo}
                                onChange={(e) =>
                                    form.setData('apodo', e.target.value)
                                }
                                disabled={form.processing}
                                placeholder="Ej: Mariposa do Mar"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email (opcional)</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                                disabled={form.processing}
                                placeholder="maria@ejemplo.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Rol *</Label>
                            <Select
                                value={form.data.role}
                                onValueChange={(v: 'admin' | 'member') =>
                                    form.setData('role', v)
                                }
                                disabled={form.processing}
                            >
                                <SelectTrigger id="role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">
                                        Miembro
                                    </SelectItem>
                                    <SelectItem value="admin">
                                        Administrador
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">
                                    Contraseña{' '}
                                    {editingUser
                                        ? '(dejar en blanco para no cambiar)'
                                        : '*'}
                                </Label>
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => {
                                        const p = generatePassword();
                                        form.setData((d) => ({
                                            ...d,
                                            password: p,
                                            passwordConfirm: p,
                                        }));
                                        setShowPassword(true);
                                        setCopiedPassword(false);
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                                >
                                    <Shuffle className="h-3.5 w-3.5" />
                                    Generar aleatoria
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={form.data.password}
                                        onChange={(e) =>
                                            form.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                        disabled={form.processing}
                                        placeholder="Mínimo 6 caracteres"
                                        required={!editingUser}
                                        className="pr-10"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((v) => !v)
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={
                                            showPassword
                                                ? 'Ocultar contraseña'
                                                : 'Mostrar contraseña'
                                        }
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>

                                {form.data.password && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await navigator.clipboard.writeText(
                                                form.data.password,
                                            );
                                            setCopiedPassword(true);
                                            setTimeout(
                                                () => setCopiedPassword(false),
                                                2000,
                                            );
                                        }}
                                        className="rounded-md border border-border px-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                        title="Copiar contraseña"
                                        aria-label="Copiar contraseña"
                                    >
                                        {copiedPassword ? (
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {form.data.password && showPassword && (
                                <p className="text-xs text-muted-foreground">
                                    Copia y comparte esta contraseña con el
                                    usuario antes de cerrar.
                                </p>
                            )}
                        </div>

                        {form.data.password && (
                            <div className="space-y-2">
                                <Label htmlFor="passwordConfirm">
                                    Confirmar contraseña *
                                </Label>
                                <Input
                                    id="passwordConfirm"
                                    type="password"
                                    value={form.data.passwordConfirm}
                                    onChange={(e) =>
                                        form.setData(
                                            'passwordConfirm',
                                            e.target.value,
                                        )
                                    }
                                    disabled={form.processing}
                                    placeholder="Repite la contraseña"
                                    autoComplete="new-password"
                                />
                            </div>
                        )}

                        {formError && (
                            <p
                                role="alert"
                                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                            >
                                {formError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setDialogOpen(false)}
                                disabled={form.processing}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : editingUser ? (
                                    'Guardar cambios'
                                ) : (
                                    'Crear usuario'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
