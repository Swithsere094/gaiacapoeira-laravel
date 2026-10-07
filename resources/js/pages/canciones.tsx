import { router } from '@inertiajs/react';
import { useState } from 'react';
import { SectionLayout } from '@/components/section-layout';
import { SongCard } from '@/components/song-card';
import { Music, Filter, Plus, Loader2, Search, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/components/confirm-dialog';
import { useAuth } from '@/hooks/use-auth';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Song {
    id: string;
    title: string;
    type: string;
    lyrics: string;
    translation: string | null;
    context: string | null;
    video_url: string | null;
    mestre: string | null;
    tags: string[] | null; // aquí guardamos los ritmos
    nossa: boolean;
    created_at: string;
}

const songTypes = [
    { id: 'all', label: 'Todas' },
    { id: 'ladainha', label: 'Ladainhas' },
    { id: 'corrido', label: 'Corridos' },
    { id: 'quadra', label: 'Quadras' },
    { id: 'chula', label: 'Chulas' },
    { id: 'samba', label: 'Sambas' },
];

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

const EMPTY_FORM = {
    title: '',
    type: 'corrido',
    lyrics: '',
    translation: '',
    context: '',
    video_url: '',
    mestre: '',
    ritmos: [] as string[],
    nossa: false,
};

export default function CancionesPage({ songs }: { songs: Song[] }) {
    const { user } = useAuth();
    const { confirm, notify } = useConfirm();
    const isAdmin = user?.role === 'admin';

    // Las canciones llegan como props de Inertia (ya cargadas por el servidor):
    // no hay estado de "cargando" ni de error de carga como en el sitio Next.
    const loading = false;
    const error = '';
    const fetchSongs = () => router.reload({ only: ['songs'] });
    const [selectedType, setSelectedType] = useState('all');
    const [onlyNossas, setOnlyNossas] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // ── Dialog helpers ─────────────────────────────────────────────────
    const openAdd = () => {
        setEditingSong(null);
        setForm(EMPTY_FORM);
        setFormError('');
        setDialogOpen(true);
    };

    const openEdit = (song: Song) => {
        setEditingSong(song);
        setForm({
            title: song.title,
            type: song.type,
            lyrics: song.lyrics,
            translation: song.translation ?? '',
            context: song.context ?? '',
            video_url: song.video_url ?? '',
            mestre: song.mestre ?? '',
            ritmos: song.tags ?? [],
            nossa: song.nossa,
        });
        setFormError('');
        setDialogOpen(true);
    };

    // Toggle un ritmo en el array
    const toggleRitmo = (ritmo: string) => {
        setForm((f) => ({
            ...f,
            ritmos: f.ritmos.includes(ritmo)
                ? f.ritmos.filter((r) => r !== ritmo)
                : [...f.ritmos, ritmo],
        }));
    };

    // ── Save (create / update) ─────────────────────────────────────────
    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        // Los ritmos se guardan en la columna "tags".
        const { ritmos, ...rest } = form;
        const payload = { ...rest, tags: ritmos.length > 0 ? ritmos : null };
        const options = {
            preserveScroll: true,
            onSuccess: () => setDialogOpen(false),
            onError: (errors: Record<string, string>) =>
                setFormError(Object.values(errors)[0] ?? 'Error al guardar'),
            onFinish: () => setSaving(false),
        };

        if (editingSong) {
            router.put(`/canciones/${editingSong.id}`, payload, options);
        } else {
            router.post('/canciones', payload, options);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: '¿Eliminar esta canción?',
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (!ok) return;
        router.delete(`/canciones/${id}`, {
            preserveScroll: true,
            onError: () =>
                void notify({ title: 'No se pudo eliminar la canción.' }),
        });
    };

    // ── Filter ────────────────────────────────────────────────────────
    const filteredSongs = songs.filter((s) => {
        const matchesType = selectedType === 'all' || s.type === selectedType;
        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            s.title.toLowerCase().includes(q) ||
            s.lyrics.toLowerCase().includes(q);
        return matchesType && matchesSearch && (!onlyNossas || s.nossa);
    });

    return (
        <SectionLayout
            title="Sabiá cantou"
            description="Cancionero para que no pares de cantar en la roda"
        >
            {/* Song Types Info */}
            <div className="mb-8 rounded-xl bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 font-serif font-bold text-foreground">
                    <Music className="h-5 w-5 text-primary" />
                    Tipos de Canciones
                </h2>
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <span className="font-medium text-foreground">
                            Ladainha:
                        </span>
                        <span className="text-muted-foreground">
                            {' '}
                            Canto inicial solista.
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-foreground">
                            Chula:
                        </span>
                        <span className="text-muted-foreground">
                            {' '}
                            Respuesta coral a la ladainha.
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-foreground">
                            Corrido:
                        </span>
                        <span className="text-muted-foreground">
                            {' '}
                            Cantos rápidos durante el juego.
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-foreground">
                            Quadra:
                        </span>
                        <span className="text-muted-foreground">
                            {' '}
                            Estrofas de cuatro versos.
                        </span>
                    </div>
                </div>
            </div>

            {/* Search + Add */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por título o letra..."
                        className="pr-8 pl-9"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Limpiar búsqueda"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <Button onClick={openAdd} className="shrink-0 gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva canción
                </Button>
            </div>

            {/* Filter by type */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
                <Filter className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                    {/* "Nossas" se combina con el tipo y la búsqueda — por eso es un
              toggle aparte y no una opción más de songTypes. */}
                    <button
                        onClick={() => setOnlyNossas((v) => !v)}
                        aria-pressed={onlyNossas}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                            onlyNossas
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-primary/40 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )}
                    >
                        <Star
                            className={cn(
                                'h-3.5 w-3.5',
                                onlyNossas ? 'fill-current' : 'text-primary',
                            )}
                        />
                        Nossas
                    </button>
                    <div
                        aria-hidden="true"
                        className="my-1 w-px shrink-0 bg-border"
                    />
                    {songTypes.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedType(t.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedType === t.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
                {(searchQuery || onlyNossas) && (
                    <span className="w-full shrink-0 text-sm text-muted-foreground sm:w-auto">
                        {filteredSongs.length} resultado
                        {filteredSongs.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* States */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {!loading && error && (
                <div className="py-12 text-center">
                    <p className="text-destructive">{error}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={fetchSongs}
                    >
                        Reintentar
                    </Button>
                </div>
            )}

            {!loading && !error && filteredSongs.length === 0 && (
                <div className="py-12 text-center">
                    <Music className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                        {songs.length === 0
                            ? 'Aún no hay canciones. ¡Agrega la primera!'
                            : 'No hay canciones que coincidan con los filtros.'}
                    </p>
                </div>
            )}

            {/* Songs List */}
            {!loading && !error && (
                <div className="space-y-6">
                    {filteredSongs.map((song) => (
                        <SongCard
                            key={song.id}
                            id={song.id}
                            title={song.title}
                            type={song.type}
                            lyrics={song.lyrics}
                            translation={song.translation ?? ''}
                            history={song.context ?? ''}
                            videoUrl={song.video_url ?? ''}
                            mestre={song.mestre ?? ''}
                            ritmos={song.tags ?? []}
                            nossa={song.nossa}
                            onEdit={() => openEdit(song)}
                            onDelete={
                                isAdmin
                                    ? () => handleDelete(song.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {editingSong ? 'Editar canción' : 'Nueva canción'}
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
                                    placeholder="Ej: Paranauê"
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
                                        <SelectItem value="chula">
                                            Chula
                                        </SelectItem>
                                        <SelectItem value="samba">
                                            Samba
                                        </SelectItem>
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
                                    const selected =
                                        form.ritmos.includes(ritmo);
                                    return (
                                        <button
                                            key={ritmo}
                                            type="button"
                                            disabled={saving}
                                            onClick={() => toggleRitmo(ritmo)}
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
                                placeholder="Ej: Mestre Pastinha"
                            />
                        </div>

                        {/* Nossa — al crear la marca cualquiera; al editar, solo admin
                (la API ignora el cambio si no es admin, esto solo lo refleja). */}
                        {(() => {
                            const locked = !!editingSong && !isAdmin;
                            return (
                                <div className="flex items-start gap-3 rounded-lg border border-border p-3">
                                    <Checkbox
                                        id="nossa"
                                        checked={form.nossa}
                                        onCheckedChange={(v) =>
                                            setForm((f) => ({
                                                ...f,
                                                nossa: v === true,
                                            }))
                                        }
                                        disabled={saving || locked}
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
                                            {locked
                                                ? 'Solo un admin puede cambiar esta marca en una canción ya creada.'
                                                : 'Del grupo o de algún integrante. Aparece en el filtro "Nossas".'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

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
                                placeholder="Letra en portugués..."
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
                                placeholder="Traducción al español..."
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
                                placeholder="Origen, historia o contexto de la canción..."
                            />
                        </div>

                        {/* Video URL */}
                        <div className="space-y-2">
                            <Label htmlFor="video_url">
                                URL de video YouTube (opcional)
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
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        {formError && (
                            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {formError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setDialogOpen(false)}
                                disabled={saving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : editingSong ? (
                                    'Guardar cambios'
                                ) : (
                                    'Agregar canción'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </SectionLayout>
    );
}
