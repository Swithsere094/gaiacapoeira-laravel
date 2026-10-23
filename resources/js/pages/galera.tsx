import { router, usePage } from '@inertiajs/react';
import {
    Play,
    Mic2,
    Plus,
    Loader2,
    Calendar,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { CantoriaFormDialog } from '@/components/galera/cantoria-form-dialog';
import { RodaFormDialog } from '@/components/galera/roda-form-dialog';
import { VideoCard } from '@/components/galera/video-card';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { PageTabs } from '@/components/page-tabs';
import { SearchInput } from '@/components/search-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { formatDate } from '@/lib/dates';
import { useSearchParams } from '@/lib/navigation';

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
function monthLabel(roda: Roda): string {
    return formatDate(roda.event_date ?? roda.created_at, 'month');
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

// ── Page ──────────────────────────────────────────────────────────
export default function GaleraPage({
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

    const { can } = useAuth();
    const { confirm, notify } = useConfirm();
    const canManage = can('galera.gestionar');
    const { flash } = usePage().props;

    // ── Rodas state ──────────────────────────────────────────────────
    const [jogadorQuery, setJogadorQuery] = useState('');

    // Formularios para agregar (se remontan con `key` en cada apertura).
    const [rodaDialogOpen, setRodaDialogOpen] = useState(false);
    const [cantoriaDialogOpen, setCantoriaDialogOpen] = useState(false);
    const [formKey, setFormKey] = useState(0);
    const openRodaForm = () => {
        setFormKey((k) => k + 1);
        setRodaDialogOpen(true);
    };
    const openCantoriaForm = () => {
        setFormKey((k) => k + 1);
        setCantoriaDialogOpen(true);
    };

    // ── YouTube sync state ───────────────────────────────────────────
    // El mensaje del resultado llega como flash de sesión (success/error) y se
    // muestra en la pestaña desde la que se sincronizó.
    const [syncing, setSyncing] = useState(false);
    const [cantoriaSyncing, setCantoriaSyncing] = useState(false);
    const [syncTab, setSyncTab] = useState<'rodas' | 'cantorias' | null>(null);
    const flashMsg = flash.error ?? flash.success ?? '';
    const syncMsg = syncTab === 'rodas' ? flashMsg : '';
    const cantoriaSyncMsg = syncTab === 'cantorias' ? flashMsg : '';

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
        <PageLayout
            title="Galera"
            header={
                <PageHeader
                    icon={Play}
                    title="Galera"
                    description="Rodas y cantorias de nuestra comunidad"
                />
            }
            tabs={
                <PageTabs
                    label="Rodas o cantorias"
                    tabs={[
                        {
                            key: 'rodas',
                            label: 'Rodas',
                            icon: Play,
                            active: activeTab === 'rodas',
                            onClick: () => setTab('rodas'),
                        },
                        {
                            key: 'cantorias',
                            label: 'Cantorias',
                            icon: Mic2,
                            active: activeTab === 'cantorias',
                            onClick: () => setTab('cantorias'),
                        },
                    ]}
                />
            }
        >
            {/* ── TAB: RODAS ─────────────────────────────────────────── */}
            {activeTab === 'rodas' && (
                <div>
                    {/* Toolbar */}
                    <div className="mb-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <SearchInput
                            value={jogadorQuery}
                            onChange={setJogadorQuery}
                            label="Buscar rodas por jogador"
                            placeholder="Buscar jogador…"
                            className="w-full flex-1 sm:max-w-xs"
                        />

                        <div className="ml-auto flex flex-wrap items-center gap-2">
                            {jogadorQuery && (
                                <span className="text-sm text-muted-foreground">
                                    {filteredRodas.length} resultado
                                    {filteredRodas.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {canManage && (
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
                                            ? 'Sincronizando…'
                                            : 'Sync YouTube'}
                                    </Button>

                                    <Button
                                        onClick={openRodaForm}
                                        className="shrink-0 gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nueva roda
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

                    {filteredRodas.length === 0 && (
                        <EmptyState icon={Play}>
                            {rodas.length === 0
                                ? 'Aún no hay rodas.'
                                : `No hay rodas con "${jogadorQuery}".`}
                        </EmptyState>
                    )}

                    {/* Grouped by month */}
                    {filteredRodas.length > 0 && (
                        <div className="space-y-12">
                            {groupedRodas.map(({ label, items }) => (
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
                                                title={roda.title}
                                                description={
                                                    roda.description ?? ''
                                                }
                                                videoUrl={roda.video_url}
                                                location={roda.location ?? ''}
                                                eventDate={
                                                    roda.event_date ?? ''
                                                }
                                                views={roda.views ?? 0}
                                                onDelete={
                                                    canManage
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
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: CANTORIAS ─────────────────────────────────────── */}
            {activeTab === 'cantorias' && (
                <div>
                    {/* Toolbar */}
                    {canManage && (
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
                                        ? 'Sincronizando…'
                                        : 'Sync YouTube'}
                                </Button>
                                <Button
                                    onClick={openCantoriaForm}
                                    className="shrink-0 gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nueva cantoria
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

                    {cantorias.length === 0 && (
                        <EmptyState
                            icon={Mic2}
                            action={
                                canManage && (
                                    <Button
                                        className="gap-2"
                                        onClick={openCantoriaForm}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Crear la primera
                                    </Button>
                                )
                            }
                        >
                            Aún no hay cantorias registradas.
                        </EmptyState>
                    )}

                    {/* Cantorias list */}
                    {cantorias.length > 0 && (
                        <div className="space-y-4">
                            {cantorias.map((cantoria) => {
                                const date = cantoria.event_date
                                    ? formatDate(cantoria.event_date)
                                    : null;

                                return (
                                    <article
                                        key={cantoria.id}
                                        className="flex items-start gap-4 panel p-5"
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
                                                    {cantoria.description}
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
                                                    href={cantoria.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                >
                                                    <Play className="h-3.5 w-3.5" />
                                                    Ver video
                                                </a>
                                            )}
                                        </div>
                                        {canManage && (
                                            <IconButton
                                                icon={Trash2}
                                                label="Eliminar cantoria"
                                                tone="destructive"
                                                onClick={() =>
                                                    handleDeleteCantoria(
                                                        cantoria.id,
                                                    )
                                                }
                                            />
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {canManage && (
                <>
                    <RodaFormDialog
                        key={`roda-${formKey}`}
                        open={rodaDialogOpen}
                        onOpenChange={setRodaDialogOpen}
                    />
                    <CantoriaFormDialog
                        key={`cantoria-${formKey}`}
                        open={cantoriaDialogOpen}
                        onOpenChange={setCantoriaDialogOpen}
                    />
                </>
            )}
        </PageLayout>
    );
}
