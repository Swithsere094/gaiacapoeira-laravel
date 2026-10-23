import { router } from '@inertiajs/react';
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
import { Textarea } from '@/components/ui/textarea';

/**
 * Crear una roda a mano (permiso `galera.gestionar`). Empieza vacío: quien
 * lo usa le cambia el `key` en cada apertura.
 */
export function RodaFormDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = useState({
        title: '',
        description: '',
        video_url: '',
        location: '',
        event_date: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);
        router.post('/galera/rodas', form, {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors) =>
                setFormError(Object.values(errors)[0] ?? 'Error al guardar'),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nueva roda</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSave} className="mt-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="r-title">Título *</Label>
                        <Input
                            id="r-title"
                            value={form.title}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    title: e.target.value,
                                }))
                            }
                            required
                            disabled={saving}
                            placeholder="Ej.: Roda de verano — João / María"
                        />
                        <p className="text-xs text-muted-foreground">
                            Incluye el nombre del jogador en el título para que
                            sea buscable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="r-date">Fecha (opcional)</Label>
                            <Input
                                id="r-date"
                                type="date"
                                value={form.event_date}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        event_date: e.target.value,
                                    }))
                                }
                                disabled={saving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="r-location">Lugar (opcional)</Label>
                            <Input
                                id="r-location"
                                value={form.location}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        location: e.target.value,
                                    }))
                                }
                                disabled={saving}
                                placeholder="Ej.: Parque Central"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="r-desc">Descripción (opcional)</Label>
                        <Textarea
                            id="r-desc"
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                            disabled={saving}
                            rows={2}
                            placeholder="Breve descripción del encuentro…"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="r-video">
                            Video de YouTube o Vimeo *
                        </Label>
                        <Input
                            id="r-video"
                            type="url"
                            value={form.video_url}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    video_url: e.target.value,
                                }))
                            }
                            required
                            disabled={saving}
                            placeholder="https://www.youtube.com/watch?v=…"
                        />
                    </div>

                    <FormError message={formError} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={saving}
                    >
                        Crear roda
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
