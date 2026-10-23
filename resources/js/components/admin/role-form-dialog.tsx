import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormActions } from '@/components/form-actions';
import { FormError } from '@/components/form-error';
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
import type { PermissionRow, RoleRow } from '@/types/admin';

/**
 * Crear o editar un rol (solo admin). Arranca con los datos del rol (o
 * vacío): quien lo usa le cambia el `key` en cada apertura.
 */
export function RoleFormDialog({
    open,
    onOpenChange,
    editing,
    permissions,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: RoleRow | null;
    permissions: PermissionRow[];
}) {
    const form = useForm({
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        permissions: editing?.permissions ?? ([] as Permission[]),
    });

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
            onSuccess: () => onOpenChange(false),
        };

        if (editing) {
            form.put(`/admin/roles/${editing.id}`, options);
        } else {
            form.post('/admin/roles', options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Editar rol' : 'Nuevo rol'}
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
                            placeholder="Ej.: Profesor"
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
                                            togglePermission(p.slug, v === true)
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
                            Gestionar usuarios y roles queda siempre solo para
                            administradores.
                        </p>
                    </fieldset>

                    <FormError message={Object.values(form.errors)[0]} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={form.processing}
                    >
                        {editing ? 'Guardar cambios' : 'Crear rol'}
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
