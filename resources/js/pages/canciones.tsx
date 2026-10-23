import { router } from '@inertiajs/react';
import { Music, Filter, Plus, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SongCard } from '@/components/canciones/song-card';
import { SongFormDialog } from '@/components/canciones/song-form-dialog';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { PanelTitle } from '@/components/headings';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useSearchParams } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import type { Song } from '@/types/canciones';

const songTypes = [
    { id: 'all', label: 'Todas' },
    { id: 'ladainha', label: 'Ladainhas' },
    { id: 'corrido', label: 'Corridos' },
    { id: 'quadra', label: 'Quadras' },
    { id: 'chula', label: 'Chulas' },
    { id: 'samba', label: 'Sambas' },
];

export default function CancionesPage({ songs }: { songs: Song[] }) {
    const { can } = useAuth();
    const { confirm, notify } = useConfirm();
    const canDelete = can('canciones.eliminar');
    const canEditNossa = can('canciones.nossa');

    const [selectedType, setSelectedType] = useState('all');
    const [onlyNossas, setOnlyNossas] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Enlace compartido (/canciones?cancion=<id>): esa canción se abre sola al
    // entrar. Si no se tiene sesión, el login devuelve a esta misma dirección
    // (redirect()->intended). Se lee una sola vez, al montar.
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sharedId] = useState(() => searchParams.get('cancion'));

    // Quita ?cancion= de la dirección (sin pedir nada al servidor), para que
    // una recarga no vuelva a abrir la canción.
    const clearSharedParam = () => {
        if (!searchParams.has('cancion')) return;
        searchParams.delete('cancion');
        const query = searchParams.toString();
        router.replace({
            url: query ? `${pathname}?${query}` : pathname,
            preserveScroll: true,
            preserveState: true,
        });
    };

    useEffect(() => {
        if (sharedId && !songs.some((s) => s.id === sharedId)) {
            clearSharedParam();
            void notify({
                title: 'Canción no encontrada',
                description:
                    'Esta canción ya no existe o el enlace está incompleto.',
            });
        }
        // Solo al entrar a la página con el enlace.
    }, []);

    // Formulario (se remonta con `key` en cada apertura).
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [formKey, setFormKey] = useState(0);

    const openForm = (song: Song | null) => {
        setEditingSong(song);
        setFormKey((k) => k + 1);
        setDialogOpen(true);
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
        <PageLayout
            title="Sabiá cantou"
            header={
                <PageHeader
                    icon={Music}
                    title="Sabiá cantou"
                    description="Cancionero para que no pares de cantar en la roda"
                />
            }
        >
            {/* Song Types Info */}
            <div className="mb-8 panel p-6">
                <PanelTitle icon={Music} className="mb-4">
                    Tipos de canciones
                </PanelTitle>
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
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    label="Buscar canciones"
                    placeholder="Buscar por título o letra…"
                    className="flex-1"
                />
                <Button
                    onClick={() => openForm(null)}
                    className="shrink-0 gap-2"
                >
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

            {filteredSongs.length === 0 && (
                <EmptyState icon={Music}>
                    {songs.length === 0
                        ? 'Aún no hay canciones. ¡Agrega la primera!'
                        : 'No hay canciones que coincidan con los filtros.'}
                </EmptyState>
            )}

            {/* Songs List */}
            {filteredSongs.length > 0 && (
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
                            defaultOpen={song.id === sharedId}
                            onClose={clearSharedParam}
                            onEdit={() => openForm(song)}
                            onDelete={
                                canDelete
                                    ? () => handleDelete(song.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}

            <SongFormDialog
                key={formKey}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editing={editingSong}
                canEditNossa={canEditNossa}
            />
        </PageLayout>
    );
}
