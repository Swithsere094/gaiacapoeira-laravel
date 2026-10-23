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
 * Crear una cantoria a mano (permiso `galera.gestionar`). Empieza vacío:
 * quien lo usa le cambia el `key` en cada apertura.
 */
export function CantoriaFormDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [form, setForm] = useState({
        title: '',
        video_url: '',
        description: '',
        event_date: '',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);
        router.post('/galera/cantorias', form, {
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
                    <DialogTitle>Nueva cantoria</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSave} className="mt-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="c-title">Título *</Label>
                        <Input
                            id="c-title"
                            value={form.title}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    title: e.target.value,
                                }))
                            }
                            required
                            disabled={saving}
                            placeholder="Ej.: Cantoria del grupo — enero 2025"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="c-date">Fecha (opcional)</Label>
                        <Input
                            id="c-date"
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
                        <Label htmlFor="c-desc">Descripción (opcional)</Label>
                        <Textarea
                            id="c-desc"
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                            disabled={saving}
                            rows={3}
                            placeholder="Notas sobre esta cantoria…"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="c-video">
                            Video de YouTube o Vimeo (opcional)
                        </Label>
                        <Input
                            id="c-video"
                            type="url"
                            value={form.video_url}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    video_url: e.target.value,
                                }))
                            }
                            disabled={saving}
                            placeholder="https://www.youtube.com/watch?v=…"
                        />
                    </div>

                    <FormError message={formError} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={saving}
                    >
                        Crear cantoria
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
