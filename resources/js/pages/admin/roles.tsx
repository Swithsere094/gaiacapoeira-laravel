import { router } from '@inertiajs/react';
import { KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RoleFormDialog } from '@/components/admin/role-form-dialog';
import { useConfirm } from '@/components/confirm-dialog';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import type { Permission } from '@/types';
import type { PermissionRow, RoleRow } from '@/types/admin';

export default function AdminRolesPage({
    roles,
    permissions,
}: {
    roles: RoleRow[];
    permissions: PermissionRow[];
}) {
    const { confirm, notify } = useConfirm();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
    // Cambia en cada apertura: el formulario empieza de cero.
    const [formKey, setFormKey] = useState(0);

    const permissionName = (slug: Permission) =>
        permissions.find((p) => p.slug === slug)?.name ?? slug;

    const openForm = (role: RoleRow | null) => {
        setEditingRole(role);
        setFormKey((k) => k + 1);
        setDialogOpen(true);
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

    return (
        <PageLayout
            title="Gestión de roles"
            width="medium"
            header={
                <PageHeader
                    icon={KeyRound}
                    title="Gestión de roles"
                    description="Crea roles y elige qué puede hacer cada uno"
                    actions={
                        <Button
                            onClick={() => openForm(null)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo rol
                        </Button>
                    }
                />
            }
        >
            <div className="space-y-3">
                {roles.map((r) => (
                    <div key={r.id} className="panel p-5">
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
                                    <IconButton
                                        icon={Pencil}
                                        label={`Editar el rol ${r.name}`}
                                        onClick={() => openForm(r)}
                                    />
                                )}
                                {!r.is_base && (
                                    <IconButton
                                        icon={Trash2}
                                        label={`Eliminar el rol ${r.name}`}
                                        tone="destructive"
                                        onClick={() => handleDelete(r)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {r.is_admin ? (
                                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-foreground">
                                    Todos los permisos, incluida la gestión de
                                    usuarios y roles
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

            <RoleFormDialog
                key={formKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editingRole}
                permissions={permissions}
            />
        </PageLayout>
    );
}
