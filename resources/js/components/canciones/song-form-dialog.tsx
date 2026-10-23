import { router } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Song } from '@/types/canciones';

// Ritmos / toques del berimbau más comunes en capoeira
const RITMOS = [
    'Angola',
    'São Bento Grande',
    'São Bento Pequeno',
    'Iuna',
    'Banguela',
    'Idalina',
    'Cavalaria',
    'Amazonas',
    'Santa Maria',
    'Apanha Laranja',
];

function formFrom(song: Song | null) {
    return {
        title: song?.title ?? '',
        type: song?.type ?? 'corrido',
        lyrics: song?.lyrics ?? '',
        translation: song?.translation ?? '',
        context: song?.context ?? '',
        video_url: song?.video_url ?? '',
        mestre: song?.mestre ?? '',
        ritmos: song?.tags ?? ([] as string[]),
        nossa: song?.nossa ?? false,
    };
}

/**
 * Crear o editar una canción (cualquier sesión). Arranca con los datos de
 * la canción (o vacío): quien lo usa le cambia el `key` en cada apertura.
 */
export function SongFormDialog({
    open,
    onOpenChange,
    editing,
    canEditNossa,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: Song | null;
    /** Permiso `canciones.nossa`: cambiar la marca en una canción ya creada. */
    canEditNossa: boolean;
}) {
    const [form, setForm] = useState(() => formFrom(editing));
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const toggleRitmo = (ritmo: string) => {
        setForm((f) => ({
            ...f,
            ritmos: f.ritmos.includes(ritmo)
                ? f.ritmos.filter((r) => r !== ritmo)
                : [...f.ritmos, ritmo],
        }));
    };

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        // Los ritmos se guardan en la columna "tags".
        const { ritmos, ...rest } = form;
        const payload = { ...rest, tags: ritmos.length > 0 ? ritmos : null };
        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
            onError: (errors: Record<string, string>) =>
                setFormError(Object.values(errors)[0] ?? 'Error al guardar'),
            onFinish: () => setSaving(false),
        };

        if (editing) {
            router.put(`/canciones/${editing.id}`, payload, options);
        } else {
            router.post('/canciones', payload, options);
        }
    };

    // Nossa: al crear la marca cualquiera; al editar, solo con permiso
    // (el servidor ignora el cambio sin el permiso, esto solo lo refleja).
    const nossaLocked = !!editing && !canEditNossa;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Editar canción' : 'Nueva canción'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSave} className="mt-2 space-y-5">
                    {/* Título + Tipo */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        title: e.target.value,
                                    }))
                                }
                                required
                                disabled={saving}
                                placeholder="Ej.: Paranauê"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Tipo *</Label>
                            <Select
                                value={form.type}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, type: v }))
                                }
                                disabled={saving}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ladainha">
                                        Ladainha
                                    </SelectItem>
                                    <SelectItem value="corrido">
                                        Corrido
                                    </SelectItem>
                                    <SelectItem value="quadra">
                                        Quadra
                                    </SelectItem>
                                    <SelectItem value="chula">Chula</SelectItem>
                                    <SelectItem value="samba">Samba</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ritmo — multi-selección */}
                    <div className="space-y-2">
                        <Label>
                            Ritmo{' '}
                            <span className="text-xs font-normal text-muted-foreground">
                                (puede elegir varios)
                            </span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {RITMOS.map((ritmo) => {
                                const selected = form.ritmos.includes(ritmo);

                                return (
                                    <button
                                        key={ritmo}
                                        type="button"
                                        disabled={saving}
                                        onClick={() => toggleRitmo(ritmo)}
                                        aria-pressed={selected}
                                        className={cn(
                                            'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
                                            selected
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                                        )}
                                    >
                                        {ritmo}
                                    </button>
                                );
                            })}
                        </div>
                        {form.ritmos.length > 0 && (
                            <p className="text-xs text-primary">
                                Seleccionados: {form.ritmos.join(' · ')}
                            </p>
                        )}
                    </div>

                    {/* Mestre */}
                    <div className="space-y-2">
                        <Label htmlFor="mestre">
                            Mestre / Autor (opcional)
                        </Label>
                        <Input
                            id="mestre"
                            value={form.mestre}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    mestre: e.target.value,
                                }))
                            }
                            disabled={saving}
                            placeholder="Ej.: Mestre Pastinha"
                        />
                    </div>

                    {/* Nossa */}
                    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                        <Checkbox
                            id="nossa"
                            checked={form.nossa}
                            onCheckedChange={(v) =>
                                setForm((f) => ({ ...f, nossa: v === true }))
                            }
                            disabled={saving || nossaLocked}
                            className="mt-0.5"
                        />
                        <div className="space-y-1">
                            <Label
                                htmlFor="nossa"
                                className="flex items-center gap-1.5"
                            >
                                <Star className="h-3.5 w-3.5 text-primary" />
                                Canción nossa
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {nossaLocked
                                    ? 'Solo un admin puede cambiar esta marca en una canción ya creada.'
                                    : 'Del grupo o de algún integrante. Aparece en el filtro "Nossas".'}
                            </p>
                        </div>
                    </div>

                    {/* Letra */}
                    <div className="space-y-2">
                        <Label htmlFor="lyrics">Letra *</Label>
                        <Textarea
                            id="lyrics"
                            value={form.lyrics}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    lyrics: e.target.value,
                                }))
                            }
                            required
                            disabled={saving}
                            rows={5}
                            placeholder="Letra en portugués…"
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Traducción */}
                    <div className="space-y-2">
                        <Label htmlFor="translation">
                            Traducción (opcional)
                        </Label>
                        <Textarea
                            id="translation"
                            value={form.translation}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    translation: e.target.value,
                                }))
                            }
                            disabled={saving}
                            rows={5}
                            placeholder="Traducción al español…"
                            className="font-mono text-sm"
                        />
                    </div>

                    {/* Historia */}
                    <div className="space-y-2">
                        <Label htmlFor="context">
                            Historia / Contexto (opcional)
                        </Label>
                        <Textarea
                            id="context"
                            value={form.context}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    context: e.target.value,
                                }))
                            }
                            disabled={saving}
                            rows={3}
                            placeholder="Origen, historia o contexto de la canción…"
                        />
                    </div>

                    {/* Video URL */}
                    <div className="space-y-2">
                        <Label htmlFor="video_url">
                            Video de YouTube o Vimeo (opcional)
                        </Label>
                        <Input
                            id="video_url"
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
                        {editing ? 'Guardar cambios' : 'Crear canción'}
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
