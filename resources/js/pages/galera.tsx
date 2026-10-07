import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useSearchParams } from '@/lib/navigation';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { VideoCard } from '@/components/video-card';
import { useConfirm } from '@/components/confirm-dialog';
import { useAuth } from '@/hooks/use-auth';
import {
    Play,
    Mic2,
    Plus,
    Loader2,
    Search,
    Calendar,
    X,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────
interface Roda {
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    location: string | null;
    event_date: string | null;
    views: number;
    created_at: string;
}

interface Cantoria {
    id: string;
    title: string;
    video_url: string | null;
    description: string | null;
    event_date: string | null;
    created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────
function parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function monthLabel(roda: Roda): string {
    const raw = roda.event_date
        ? parseLocalDate(roda.event_date)
        : new Date(roda.created_at);
    const label = raw.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupByMonth(rodas: Roda[]): { label: string; items: Roda[] }[] {
    const map = new Map<string, Roda[]>();
    for (const r of rodas) {
        const key = monthLabel(r);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
    }
    return Array.from(map.entries()).map(([label, items]) => ({
        label,
        items,
    }));
}

// ── Empty forms ───────────────────────────────────────────────────
const EMPTY_RODA = {
    title: '',
    description: '',
    video_url: '',
    location: '',
    event_date: '',
};
const EMPTY_CANTORIA = {
    title: '',
    video_url: '',
    description: '',
    event_date: '',
};

// ── Page ──────────────────────────────────────────────────────────
export default function GaleraContent({
    rodas,
    cantorias,
}: {
    rodas: Roda[];
    cantorias: Cantoria[];
}) {
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('tab') ?? 'rodas') as
        | 'rodas'
        | 'cantorias';

    const { user } = useAuth();
    const { confirm, notify } = useConfirm();
    const isAdmin = user?.role === 'admin';
    const { flash } = usePage().props;

    // Rodas y cantorias llegan como props de Inertia (ya cargadas por el
    // servidor): no hay estado de "cargando" ni de error de carga.
    const rodasLoading = false;
    const rodasError = '';
    const cantoriasLoading = false;
    const cantoriasError = '';
    const fetchRodas = () => router.reload({ only: ['rodas'] });
    const fetchCantorias = () => router.reload({ only: ['cantorias'] });

    // ── Rodas state ──────────────────────────────────────────────────
    const [jogadorQuery, setJogadorQuery] = useState('');

    const [rodaDialogOpen, setRodaDialogOpen] = useState(false);
    const [rodaForm, setRodaForm] = useState(EMPTY_RODA);
    const [rodaSaving, setRodaSaving] = useState(false);
    const [rodaFormError, setRodaFormError] = useState('');

    // ── YouTube sync state ───────────────────────────────────────────
    // El mensaje del resultado llega como flash de sesión (success/error) y se
    // muestra en la pestaña desde la que se sincronizó.
    const [syncing, setSyncing] = useState(false);
    const [cantoriaSyncing, setCantoriaSyncing] = useState(false);
    const [syncTab, setSyncTab] = useState<'rodas' | 'cantorias' | null>(null);
    const flashMsg = flash.error ?? flash.success ?? '';
    const syncMsg = syncTab === 'rodas' ? flashMsg : '';
    const cantoriaSyncMsg = syncTab === 'cantorias' ? flashMsg : '';

    // ── Cantorias state ──────────────────────────────────────────────
    const [cantoriaDialogOpen, setCantoriaDialogOpen] = useState(false);
    const [cantoriaForm, setCantoriaForm] = useState(EMPTY_CANTORIA);
    const [cantoriaSaving, setCantoriaSaving] = useState(false);
    const [cantoriaFormError, setCantoriaFormError] = useState('');

    // ── Filtered & grouped rodas ─────────────────────────────────────
    const filteredRodas = useMemo(() => {
        const q = jogadorQuery.trim().toLowerCase();
        if (!q) return rodas;
        return rodas.filter((r) => r.title.toLowerCase().includes(q));
    }, [rodas, jogadorQuery]);

    const groupedRodas = useMemo(
        () => groupByMonth(filteredRodas),
        [filteredRodas],
    );

    // ── YouTube sync handlers ────────────────────────────────────────
    const handleSync = () => {
        setSyncing(true);
        setSyncTab('rodas');
        router.post(
            '/galera/rodas/sync',
            {},
            { preserveScroll: true, onFinish: () => setSyncing(false) },
        );
    };

    const handleSyncCantorias = () => {
        setCantoriaSyncing(true);
        setSyncTab('cantorias');
        router.post(
            '/galera/cantorias/sync',
            {},
            { preserveScroll: true, onFinish: () => setCantoriaSyncing(false) },
        );
    };

    // ── Roda handlers ────────────────────────────────────────────────
    const handleSaveRoda = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setRodaFormError('');
        setRodaSaving(true);
        router.post('/galera/rodas', rodaForm, {
            preserveScroll: true,
            onSuccess: () => {
                setRodaDialogOpen(false);
                setRodaForm(EMPTY_RODA);
            },
            onError: (errors) =>
                setRodaFormError(
                    Object.values(errors)[0] ?? 'Error al guardar',
                ),
            onFinish: () => setRodaSaving(false),
        });
    };

    const handleDeleteRoda = async (id: string) => {
        const ok = await confirm({
            title: '¿Eliminar esta roda?',
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (!ok) return;
        router.delete(`/galera/rodas/${id}`, {
            preserveScroll: true,
            onError: () =>
                void notify({ title: 'No se pudo eliminar la roda.' }),
        });
    };

    // ── Cantoria handlers ────────────────────────────────────────────
    const handleSaveCantoria = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCantoriaFormError('');
        setCantoriaSaving(true);
        router.post('/galera/cantorias', cantoriaForm, {
            preserveScroll: true,
            onSuccess: () => {
                setCantoriaDialogOpen(false);
                setCantoriaForm(EMPTY_CANTORIA);
            },
            onError: (errors) =>
                setCantoriaFormError(
                    Object.values(errors)[0] ?? 'Error al guardar',
                ),
            onFinish: () => setCantoriaSaving(false),
        });
    };

    const handleDeleteCantoria = async (id: string) => {
        const ok = await confirm({
            title: '¿Eliminar esta cantoria?',
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (!ok) return;
        router.delete(`/galera/cantorias/${id}`, {
            preserveScroll: true,
            onError: () =>
                void notify({ title: 'No se pudo eliminar la cantoria.' }),
        });
    };

    // ── Tab helper ────────────────────────────────────────────────────
    const setTab = (tab: 'rodas' | 'cantorias') => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.get(
            `/galera?${params.toString()}`,
            {},
            { replace: true, preserveScroll: true, preserveState: true },
        );
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            <Head title="Galera" />
            <Navigation />

            <main className="pt-24">
                {/* Hero */}
                <div className="border-b border-border bg-gradient-to-b from-secondary/40 to-background">
                    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                        <h1 className="mb-2 font-serif text-4xl font-bold text-foreground md:text-5xl">
                            Galera
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Rodas y cantorias de nuestra comunidad
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-16 z-30 border-b border-border bg-background">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="-mb-px flex gap-1">
                            <button
                                onClick={() => setTab('rodas')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors',
                                    activeTab === 'rodas'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Play className="h-4 w-4" />
                                Rodas
                            </button>
                            <button
                                onClick={() => setTab('cantorias')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-6 py-4 text-sm font-medium transition-colors',
                                    activeTab === 'cantorias'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <Mic2 className="h-4 w-4" />
                                Cantorias
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto max-w-7xl px-4 py-10 pb-20 sm:px-6 lg:px-8">
                    {/* ── TAB: RODAS ─────────────────────────────────────────── */}
                    {activeTab === 'rodas' && (
                        <div>
                            {/* Toolbar */}
                            <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                {/* Search */}
                                <div className="relative w-full flex-1 sm:max-w-xs">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={jogadorQuery}
                                        onChange={(e) =>
                                            setJogadorQuery(e.target.value)
                                        }
                                        placeholder="Buscar jogador..."
                                        className="pr-8 pl-9"
                                    />
                                    {jogadorQuery && (
                                        <button
                                            onClick={() => setJogadorQuery('')}
                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="ml-auto flex flex-wrap items-center gap-2">
                                    {jogadorQuery && (
                                        <span className="text-sm text-muted-foreground">
                                            {filteredRodas.length} resultado
                                            {filteredRodas.length !== 1
                                                ? 's'
                                                : ''}
                                        </span>
                                    )}
                                    {isAdmin && (
                                        <>
                                            {/* Sync con YouTube */}
                                            <Button
                                                variant="outline"
                                                onClick={handleSync}
                                                disabled={syncing}
                                                className="shrink-0 gap-2"
                                                title="Importar nuevos videos desde la playlist de YouTube"
                                            >
                                                {syncing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="h-4 w-4" />
                                                )}
                                                {syncing
                                                    ? 'Sincronizando...'
                                                    : 'Sync YouTube'}
                                            </Button>

                                            <Button
                                                onClick={() => {
                                                    setRodaForm(EMPTY_RODA);
                                                    setRodaFormError('');
                                                    setRodaDialogOpen(true);
                                                }}
                                                className="shrink-0 gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar roda
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sync result message */}
                            {syncMsg && (
                                <p
                                    className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                                        syncMsg.includes('Error') ||
                                        syncMsg.includes('error')
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary'
                                    }`}
                                >
                                    {syncMsg}
                                </p>
                            )}

                            {/* States */}
                            {rodasLoading && (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            {!rodasLoading && rodasError && (
                                <div className="py-12 text-center">
                                    <p className="mb-4 text-destructive">
                                        {rodasError}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={fetchRodas}
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            )}
                            {!rodasLoading &&
                                !rodasError &&
                                filteredRodas.length === 0 && (
                                    <div className="py-16 text-center">
                                        <Play className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg text-muted-foreground">
                                            {rodas.length === 0
                                                ? 'Aún no hay rodas.'
                                                : `No hay rodas con "${jogadorQuery}".`}
                                        </p>
                                    </div>
                                )}

                            {/* Grouped by month */}
                            {!rodasLoading &&
                                !rodasError &&
                                filteredRodas.length > 0 && (
                                    <div className="space-y-12">
                                        {groupedRodas.map(
                                            ({ label, items }) => (
                                                <section key={label}>
                                                    {/* Month header */}
                                                    <div className="mb-6 flex items-center gap-3">
                                                        <Calendar className="h-5 w-5 shrink-0 text-primary" />
                                                        <h2 className="font-serif text-xl font-bold text-foreground">
                                                            {label}
                                                        </h2>
                                                        <div className="h-px flex-1 bg-border" />
                                                        <span className="shrink-0 text-sm text-muted-foreground">
                                                            {items.length}{' '}
                                                            {items.length === 1
                                                                ? 'roda'
                                                                : 'rodas'}
                                                        </span>
                                                    </div>

                                                    {/* Grid */}
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                        {items.map((roda) => (
                                                            <VideoCard
                                                                key={roda.id}
                                                                id={roda.id}
                                                                title={
                                                                    roda.title
                                                                }
                                                                description={
                                                                    roda.description ??
                                                                    ''
                                                                }
                                                                videoUrl={
                                                                    roda.video_url
                                                                }
                                                                location={
                                                                    roda.location ??
                                                                    ''
                                                                }
                                                                eventDate={
                                                                    roda.event_date ??
                                                                    ''
                                                                }
                                                                views={
                                                                    roda.views ??
                                                                    0
                                                                }
                                                                onDelete={
                                                                    isAdmin
                                                                        ? () =>
                                                                              handleDeleteRoda(
                                                                                  roda.id,
                                                                              )
                                                                        : undefined
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </section>
                                            ),
                                        )}
                                    </div>
                                )}
                        </div>
                    )}

                    {/* ── TAB: CANTORIAS ─────────────────────────────────────── */}
                    {activeTab === 'cantorias' && (
                        <div>
                            {/* Toolbar */}
                            {isAdmin && (
                                <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                                    <div className="ml-auto flex flex-wrap items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleSyncCantorias}
                                            disabled={cantoriaSyncing}
                                            className="shrink-0 gap-2"
                                            title="Importar nuevos videos desde la playlist de cantorias en YouTube"
                                        >
                                            {cantoriaSyncing ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                            {cantoriaSyncing
                                                ? 'Sincronizando...'
                                                : 'Sync YouTube'}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setCantoriaForm(EMPTY_CANTORIA);
                                                setCantoriaFormError('');
                                                setCantoriaDialogOpen(true);
                                            }}
                                            className="shrink-0 gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Agregar cantoria
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {cantoriaSyncMsg && (
                                <p
                                    className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                                        cantoriaSyncMsg.includes('Error') ||
                                        cantoriaSyncMsg.includes('error')
                                            ? 'bg-destructive/10 text-destructive'
                                            : 'bg-primary/10 text-primary'
                                    }`}
                                >
                                    {cantoriaSyncMsg}
                                </p>
                            )}

                            {/* States */}
                            {cantoriasLoading && (
                                <div className="flex justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}
                            {!cantoriasLoading && cantoriasError && (
                                <div className="py-12 text-center">
                                    <p className="mb-4 text-destructive">
                                        {cantoriasError}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={fetchCantorias}
                                    >
                                        Reintentar
                                    </Button>
                                </div>
                            )}

                            {!cantoriasLoading &&
                                !cantoriasError &&
                                cantorias.length === 0 && (
                                    <div className="py-16 text-center">
                                        <Mic2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <p className="text-lg text-muted-foreground">
                                            Aún no hay cantorias registradas.
                                        </p>
                                        {isAdmin && (
                                            <Button
                                                className="mt-4 gap-2"
                                                onClick={() => {
                                                    setCantoriaForm(
                                                        EMPTY_CANTORIA,
                                                    );
                                                    setCantoriaDialogOpen(true);
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar la primera
                                            </Button>
                                        )}
                                    </div>
                                )}

                            {/* Cantorias list */}
                            {!cantoriasLoading &&
                                !cantoriasError &&
                                cantorias.length > 0 && (
                                    <div className="space-y-4">
                                        {cantorias.map((cantoria) => {
                                            const date = cantoria.event_date
                                                ? parseLocalDate(
                                                      cantoria.event_date,
                                                  ).toLocaleDateString(
                                                      'es-ES',
                                                      {
                                                          day: 'numeric',
                                                          month: 'long',
                                                          year: 'numeric',
                                                      },
                                                  )
                                                : null;

                                            return (
                                                <article
                                                    key={cantoria.id}
                                                    className="flex items-start gap-4 rounded-xl bg-card p-5"
                                                >
                                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                                        <Mic2 className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-serif font-bold text-foreground">
                                                            {cantoria.title}
                                                        </h3>
                                                        {cantoria.description && (
                                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                                {
                                                                    cantoria.description
                                                                }
                                                            </p>
                                                        )}
                                                        {date && (
                                                            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <Calendar className="h-3 w-3" />
                                                                {date}
                                                            </p>
                                                        )}
                                                        {cantoria.video_url && (
                                                            <a
                                                                href={
                                                                    cantoria.video_url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                            >
                                                                <Play className="h-3.5 w-3.5" />
                                                                Ver video
                                                            </a>
                                                        )}
                                                    </div>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteCantoria(
                                                                    cantoria.id,
                                                                )
                                                            }
                                                            className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                            aria-label="Eliminar cantoria"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />

            {/* ── Dialog: Agregar Roda ──────────────────────────────────── */}
            <Dialog open={rodaDialogOpen} onOpenChange={setRodaDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            Agregar Roda
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSaveRoda} className="mt-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="r-title">Título *</Label>
                            <Input
                                id="r-title"
                                value={rodaForm.title}
                                onChange={(e) =>
                                    setRodaForm((f) => ({
                                        ...f,
                                        title: e.target.value,
                                    }))
                                }
                                required
                                disabled={rodaSaving}
                                placeholder="Ej: Roda verano — João / María"
                            />
                            <p className="text-xs text-muted-foreground">
                                Incluye el nombre del jogador en el título para
                                que sea buscable.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="r-video">
                                URL del Video (YouTube / Vimeo) *
                            </Label>
                            <Input
                                id="r-video"
                                type="url"
                                value={rodaForm.video_url}
                                onChange={(e) =>
                                    setRodaForm((f) => ({
                                        ...f,
                                        video_url: e.target.value,
                                    }))
                                }
                                required
                                disabled={rodaSaving}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="r-desc">
                                Descripción (opcional)
                            </Label>
                            <Textarea
                                id="r-desc"
                                value={rodaForm.description}
                                onChange={(e) =>
                                    setRodaForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                disabled={rodaSaving}
                                rows={2}
                                placeholder="Breve descripción del encuentro..."
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="r-location">Lugar</Label>
                                <Input
                                    id="r-location"
                                    value={rodaForm.location}
                                    onChange={(e) =>
                                        setRodaForm((f) => ({
                                            ...f,
                                            location: e.target.value,
                                        }))
                                    }
                                    disabled={rodaSaving}
                                    placeholder="Ej: Parque Central"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="r-date">Fecha</Label>
                                <Input
                                    id="r-date"
                                    type="date"
                                    value={rodaForm.event_date}
                                    onChange={(e) =>
                                        setRodaForm((f) => ({
                                            ...f,
                                            event_date: e.target.value,
                                        }))
                                    }
                                    disabled={rodaSaving}
                                />
                            </div>
                        </div>

                        {rodaFormError && (
                            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {rodaFormError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setRodaDialogOpen(false)}
                                disabled={rodaSaving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={rodaSaving}>
                                {rodaSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Agregar roda'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: Agregar Cantoria ──────────────────────────────── */}
            <Dialog
                open={cantoriaDialogOpen}
                onOpenChange={setCantoriaDialogOpen}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            Agregar Cantoria
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSaveCantoria}
                        className="mt-2 space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="c-title">Título *</Label>
                            <Input
                                id="c-title"
                                value={cantoriaForm.title}
                                onChange={(e) =>
                                    setCantoriaForm((f) => ({
                                        ...f,
                                        title: e.target.value,
                                    }))
                                }
                                required
                                disabled={cantoriaSaving}
                                placeholder="Ej: Cantoria del grupo — Enero 2025"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="c-video">
                                URL del Video (opcional)
                            </Label>
                            <Input
                                id="c-video"
                                type="url"
                                value={cantoriaForm.video_url}
                                onChange={(e) =>
                                    setCantoriaForm((f) => ({
                                        ...f,
                                        video_url: e.target.value,
                                    }))
                                }
                                disabled={cantoriaSaving}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="c-desc">
                                Descripción (opcional)
                            </Label>
                            <Textarea
                                id="c-desc"
                                value={cantoriaForm.description}
                                onChange={(e) =>
                                    setCantoriaForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                                disabled={cantoriaSaving}
                                rows={3}
                                placeholder="Notas sobre esta cantoria..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="c-date">Fecha (opcional)</Label>
                            <Input
                                id="c-date"
                                type="date"
                                value={cantoriaForm.event_date}
                                onChange={(e) =>
                                    setCantoriaForm((f) => ({
                                        ...f,
                                        event_date: e.target.value,
                                    }))
                                }
                                disabled={cantoriaSaving}
                            />
                        </div>

                        {cantoriaFormError && (
                            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {cantoriaFormError}
                            </p>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setCantoriaDialogOpen(false)}
                                disabled={cantoriaSaving}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={cantoriaSaving}>
                                {cantoriaSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Agregar cantoria'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
