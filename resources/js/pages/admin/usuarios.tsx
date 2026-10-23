import { router } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, Trash2, User, Users } from 'lucide-react';
import { useState } from 'react';
import { UserFormDialog } from '@/components/admin/user-form-dialog';
import { useConfirm } from '@/components/confirm-dialog';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import type { AppUser } from '@/types';
import type { RoleOption } from '@/types/admin';

export default function AdminUsuariosPage({
    users,
    roles,
}: {
    users: AppUser[];
    roles: RoleOption[];
}) {
    const { user } = useAuth();
    const { confirm, notify } = useConfirm();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    // Cambia en cada apertura: el formulario empieza de cero.
    const [formKey, setFormKey] = useState(0);

    if (!user) {
        return null;
    }

    const openForm = (u: AppUser | null) => {
        setEditingUser(u);
        setFormKey((k) => k + 1);
        setDialogOpen(true);
    };

    const handleDelete = async (u: AppUser) => {
        if (u.id === user.id) {
            await notify({ title: 'No puedes eliminarte a ti mismo.' });

            return;
        }

        const ok = await confirm({
            title: `¿Eliminar al usuario "${u.name}"?`,
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });

        if (!ok) {
            return;
        }

        router.delete(`/admin/usuarios/${u.id}`, {
            preserveScroll: true,
            onError: (errors) =>
                void notify({
                    title: errors.user ?? 'No se pudo eliminar el usuario.',
                }),
        });
    };

    return (
        <PageLayout
            title="Gestión de usuarios"
            width="medium"
            header={
                <PageHeader
                    icon={Users}
                    title="Gestión de usuarios"
                    description="Crea, edita y elimina los usuarios del grupo"
                    actions={
                        <Button
                            onClick={() => openForm(null)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo usuario
                        </Button>
                    }
                />
            }
        >
            <div className="space-y-3">
                {users.map((u) => (
                    <div
                        key={u.id}
                        className="flex items-center gap-4 panel p-5"
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
                                        // text-foreground (no text-primary): bg-primary/20 +
                                        // text-primary no cumple el contraste de WCAG AA.
                                        u.role === 'admin'
                                            ? 'bg-primary/20 text-foreground'
                                            : 'bg-secondary text-secondary-foreground',
                                    )}
                                >
                                    {u.role_name}
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
                            <IconButton
                                icon={Pencil}
                                label={`Editar a ${u.name}`}
                                onClick={() => openForm(u)}
                            />
                            {u.id !== user.id && (
                                <IconButton
                                    icon={Trash2}
                                    label={`Eliminar a ${u.name}`}
                                    tone="destructive"
                                    onClick={() => handleDelete(u)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <UserFormDialog
                key={formKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editingUser}
                editingSelf={editingUser?.id === user.id}
                roles={roles}
            />
        </PageLayout>
    );
}
