import { Head, router, useForm } from '@inertiajs/react';
import { KeyRound, Loader2, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Permission } from '@/types';

interface RoleRow {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    users_count: number;
    permissions: Permission[];
    is_admin: boolean;
    is_base: boolean;
}

interface PermissionRow {
    slug: Permission;
    name: string;
    description: string | null;
}

const EMPTY_FORM = {
    name: '',
    description: '',
    permissions: [] as Permission[],
};

export default function AdminRoles({
    roles,
    permissions,
}: {
    roles: RoleRow[];
    permissions: PermissionRow[];
}) {
    const { confirm, notify } = useConfirm();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
    const form = useForm(EMPTY_FORM);

    const permissionName = (slug: Permission) =>
        permissions.find((p) => p.slug === slug)?.name ?? slug;

    const openAdd = () => {
        setEditingRole(null);
        form.setData(EMPTY_FORM);
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (r: RoleRow) => {
        setEditingRole(r);
        form.setData({
            name: r.name,
            description: r.description ?? '',
            permissions: r.permissions,
        });
        form.clearErrors();
        setDialogOpen(true);
    };

    const togglePermission = (slug: Permission, on: boolean) => {
        form.setData(
            'permissions',
            on
                ? [...form.data.permissions, slug]
                : form.data.permissions.filter((p) => p !== slug),
        );
    };

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
        };

        if (editingRole) {
            form.put(`/admin/roles/${editingRole.id}`, options);
        } else {
            form.post('/admin/roles', options);
        }
    };

    const handleDelete = async (r: RoleRow) => {
        if (r.users_count > 0) {
            await notify({
                title: 'Este rol tiene personas asignadas.',
                description:
                    'Cámbiales el rol en Gestión de Usuarios antes de eliminarlo.',
            });

            return;
        }

        const ok = await confirm({
            title: `¿Eliminar el rol "${r.name}"?`,
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });

        if (!ok) {
            return;
        }

        router.delete(`/admin/roles/${r.id}`, {
            preserveScroll: true,
            onError: (errors) =>
                void notify({
                    title: errors.role ?? 'No se pudo eliminar el rol.',
                }),
        });
    };

    const formError = Object.values(form.errors)[0];

    return (
        <div className="min-h-screen bg-background">
            <Head title="Gestión de Roles" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 font-serif text-3xl font-bold text-foreground">
                                <KeyRound className="h-8 w-8 text-primary" />
                                Gestión de Roles
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Crea roles y elige qué puede hacer cada uno
                            </p>
                        </div>
                        <Button onClick={openAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo rol
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {roles.map((r) => (
                            <div key={r.id} className="rounded-xl bg-card p-5">
                                <div className="flex items-start gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-serif font-bold text-foreground">
                                                {r.name}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {r.users_count === 1
                                                    ? '1 persona'
                                                    : `${r.users_count} personas`}
                                            </span>
                                        </div>
                                        {r.description && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {r.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        {r.is_admin ? (
                                            <span
                                                className="p-2 text-muted-foreground"
                                                title="El rol Administrador no se modifica"
                                            >
                                                <Lock className="h-4 w-4" />
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => openEdit(r)}
                                                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                                aria-label={`Editar el rol ${r.name}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                        )}
                                        {!r.is_base && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(r)}
                                                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                aria-label={`Eliminar el rol ${r.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {r.is_admin ? (
                                        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-foreground">
                                            Todos los permisos, incluida la
                                            gestión de usuarios y roles
                                        </span>
                                    ) : r.permissions.length === 0 ? (
                                        <span className="text-xs text-muted-foreground">
                                            Sin permisos especiales
                                        </span>
                                    ) : (
                                        r.permissions.map((p) => (
                                            <span
                                                key={p}
                                                className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                                            >
                                                {permissionName(p)}
                                            </span>
                                        ))
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
                            {editingRole ? 'Editar rol' : 'Nuevo rol'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="mt-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre *</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                                maxLength={100}
                                disabled={form.processing}
                                placeholder="Ej: Profesor"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Descripción (opcional)
                            </Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                maxLength={500}
                                rows={2}
                                disabled={form.processing}
                                placeholder="Para qué es este rol"
                            />
                        </div>

                        <fieldset className="space-y-2">
                            <legend className="mb-2 text-sm font-medium">
                                Permisos
                            </legend>
                            {permissions.map((p) => {
                                const checked = form.data.permissions.includes(
                                    p.slug,
                                );

                                return (
                                    <div
                                        key={p.slug}
                                        className={cn(
                                            'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                                            checked
                                                ? 'border-primary/60'
                                                : 'border-border',
                                        )}
                                    >
                                        <Checkbox
                                            id={`perm-${p.slug}`}
                                            checked={checked}
                                            onCheckedChange={(v) =>
                                                togglePermission(
                                                    p.slug,
                                                    v === true,
                                                )
                                            }
                                            disabled={form.processing}
                                            className="mt-0.5"
                                        />
                                        <Label
                                            htmlFor={`perm-${p.slug}`}
                                            className="flex cursor-pointer flex-col items-start gap-0.5"
                                        >
                                            <span>{p.name}</span>
                                            {p.description && (
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    {p.description}
                                                </span>
                                            )}
                                        </Label>
                                    </div>
                                );
                            })}
                            <p className="text-xs text-muted-foreground">
                                Gestionar usuarios y roles queda siempre solo
                                para administradores.
                            </p>
                        </fieldset>

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
                                ) : editingRole ? (
                                    'Guardar cambios'
                                ) : (
                                    'Crear rol'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
