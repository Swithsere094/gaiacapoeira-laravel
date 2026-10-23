import { useForm } from '@inertiajs/react';
import { CheckCircle, Copy, Eye, EyeOff, Shuffle } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { FormActions } from '@/components/form-actions';
import { FormError } from '@/components/form-error';
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
import type { AppUser } from '@/types';
import type { RoleOption } from '@/types/admin';

function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);

    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

/**
 * Crear o editar un usuario (solo admin). Si alguien olvida su contraseña,
 * se la asigna un admin desde acá ("Generar aleatoria"). Arranca con los
 * datos del usuario (o vacío): quien lo usa le cambia el `key` en cada
 * apertura.
 */
export function UserFormDialog({
    open,
    onOpenChange,
    editing,
    editingSelf,
    roles,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: AppUser | null;
    /** Editando la propia cuenta: no se puede cambiar el rol (auditoría P4; el servidor también lo impide). */
    editingSelf: boolean;
    roles: RoleOption[];
}) {
    const form = useForm({
        username: editing?.username ?? '',
        name: editing?.name ?? '',
        email: editing?.email ?? '',
        role: editing?.role ?? 'member',
        apodo: editing?.apodo ?? '',
        password: '',
        passwordConfirm: '',
    });
    const [clientError, setClientError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [copiedPassword, setCopiedPassword] = useState(false);

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setClientError('');
        const { data } = form;

        if (!editing && !data.password) {
            setClientError('La contraseña es obligatoria para nuevos usuarios');

            return;
        }

        if (data.password && data.password !== data.passwordConfirm) {
            setClientError('Las contraseñas no coinciden');

            return;
        }

        if (data.password && data.password.length < 8) {
            setClientError('La contraseña debe tener al menos 8 caracteres');

            return;
        }

        form.transform((d) => ({
            ...(editing ? {} : { username: d.username }),
            name: d.name,
            email: d.email || null,
            role: d.role,
            apodo: d.apodo || null,
            ...(d.password ? { password: d.password } : {}),
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (editing) {
            form.put(`/admin/usuarios/${editing.id}`, options);
        } else {
            form.post('/admin/usuarios', options);
        }
    };

    const formError = clientError || Object.values(form.errors)[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Editar usuario' : 'Nuevo usuario'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSave} className="mt-2 space-y-4">
                    {!editing && (
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
                                placeholder="Sin espacios. Ej.: mariabatizado"
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
                            placeholder="Ej.: María García"
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
                            placeholder="Ej.: Mariposa do Mar"
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
                            onValueChange={(v: string) =>
                                form.setData('role', v)
                            }
                            disabled={form.processing || editingSelf}
                        >
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((r) => (
                                    <SelectItem key={r.slug} value={r.slug}>
                                        {r.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {editingSelf && (
                            <p className="text-xs text-muted-foreground">
                                No puedes quitarte tu propio rol de
                                administrador: así el sitio nunca queda sin
                                nadie que gestione los usuarios.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">
                                Contraseña{' '}
                                {editing
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
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.data.password}
                                    onChange={(e) =>
                                        form.setData('password', e.target.value)
                                    }
                                    disabled={form.processing}
                                    placeholder="Mínimo 8 caracteres"
                                    required={!editing}
                                    className="pr-10"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
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
                                Copia y comparte esta contraseña con el usuario
                                antes de cerrar.
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

                    <FormError message={formError} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={form.processing}
                    >
                        {editing ? 'Guardar cambios' : 'Crear usuario'}
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
