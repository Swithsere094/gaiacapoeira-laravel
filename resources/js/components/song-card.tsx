import { useState } from 'react';
import {
    Play,
    BookOpen,
    History,
    Maximize2,
    Pencil,
    Trash2,
    Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toEmbedUrl } from '@/lib/utils/video-url';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface SongCardProps {
    id: string;
    title: string;
    type: string;
    lyrics: string;
    translation: string;
    history: string;
    videoUrl: string;
    mestre?: string;
    ritmos?: string[];
    nossa?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
}

type Tab = 'lyrics' | 'translation' | 'history';

const typeLabels: Record<string, string> = {
    ladainha: 'Ladainha',
    corrido: 'Corrido',
    quadra: 'Quadra',
    chula: 'Chula',
    samba: 'Samba',
};

// text-foreground a propósito (no el color del ritmo): text-{color} sobre
// bg-{color}/20 no cumple el contraste mínimo de WCAG AA — ver auditoría
// de accesibilidad. El color queda solo en el fondo.
const typeColors: Record<string, string> = {
    ladainha: 'bg-primary/20 text-foreground',
    corrido: 'bg-accent/20 text-foreground',
    quadra: 'bg-chart-4/20 text-foreground',
    chula: 'bg-chart-5/20 text-foreground',
    samba: 'bg-chart-3/20 text-foreground',
};

function SongMeta({
    type,
    ritmos,
    mestre,
    nossa,
}: {
    type: string;
    ritmos?: string[];
    mestre?: string;
    nossa?: boolean;
}) {
    return (
        <div className="mt-1 flex flex-wrap items-center gap-2">
            {nossa && (
                <span className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                    <Star aria-hidden="true" className="h-3 w-3 fill-current" />
                    Nossa
                </span>
            )}
            <span
                className={cn(
                    'inline-block rounded px-2 py-0.5 text-xs font-medium',
                    typeColors[type] ??
                        'bg-secondary text-secondary-foreground',
                )}
            >
                {typeLabels[type] ?? type}
            </span>
            {ritmos?.map((r) => (
                <span
                    key={r}
                    className="inline-block rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                    {r}
                </span>
            ))}
            {mestre && (
                <span className="text-xs text-muted-foreground">{mestre}</span>
            )}
        </div>
    );
}

export function SongCard({
    title,
    type,
    lyrics,
    translation,
    history,
    videoUrl,
    mestre,
    ritmos,
    nossa,
    onEdit,
    onDelete,
}: SongCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('lyrics');

    const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : '';

    const open = () => {
        setActiveTab('lyrics');
        setIsOpen(true);
    };

    const tabs: {
        id: Tab;
        label: string;
        icon: typeof BookOpen;
        show: boolean;
    }[] = [
        { id: 'lyrics', label: 'Letra', icon: BookOpen, show: true },
        {
            id: 'translation',
            label: 'Traducción',
            icon: BookOpen,
            show: !!translation,
        },
        { id: 'history', label: 'Historia', icon: History, show: !!history },
    ];
    const visibleTabs = tabs.filter((t) => t.show);

    return (
        <>
            <article className="overflow-hidden rounded-xl bg-card">
                {/* Toda la tarjeta abre el modal. Editar/borrar son botones
            hermanos, no anidados: un <button> dentro de otro confunde a
            lectores de pantalla y rompe el orden de foco (ver auditoría de
            a11y). El ícono de play es solo indicativo de que hay video. */}
                <div className="flex items-center transition-colors hover:bg-secondary/30">
                    <button
                        type="button"
                        onClick={open}
                        aria-haspopup="dialog"
                        className="flex min-w-0 flex-1 items-center justify-between gap-3 p-6 text-left"
                    >
                        <div className="flex min-w-0 items-center gap-4">
                            {embedUrl && (
                                <div
                                    aria-hidden="true"
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20"
                                >
                                    <Play className="ml-0.5 h-5 w-5 text-primary" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h3 className="truncate font-serif text-xl font-bold text-card-foreground">
                                    {title}
                                    {embedUrl && (
                                        <span className="sr-only">
                                            {' '}
                                            (con video)
                                        </span>
                                    )}
                                </h3>
                                <SongMeta
                                    type={type}
                                    ritmos={ritmos}
                                    mestre={mestre}
                                    nossa={nossa}
                                />
                            </div>
                        </div>

                        <Maximize2
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 text-muted-foreground"
                        />
                    </button>

                    {(onEdit || onDelete) && (
                        <div className="flex shrink-0 items-center gap-2 pr-6">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={onEdit}
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                    aria-label="Editar canción"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                    aria-label="Eliminar canción"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </article>

            {/* Modal: letra a la izquierda, video a la derecha, cada columna con
          su propio scroll. En pantallas chicas el video queda fijo arriba y
          la letra scrollea debajo. Radix desmonta el contenido al cerrar,
          así que el iframe se destruye y el video deja de sonar. */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    aria-describedby={undefined}
                    className={cn(
                        'flex h-[90vh] flex-col gap-0 overflow-hidden p-0',
                        embedUrl ? 'sm:max-w-6xl' : 'sm:max-w-3xl',
                    )}
                >
                    <DialogHeader className="shrink-0 border-b border-border p-6 pr-12 text-left">
                        <DialogTitle className="font-serif text-2xl font-bold">
                            {title}
                        </DialogTitle>
                        <SongMeta
                            type={type}
                            ritmos={ritmos}
                            mestre={mestre}
                            nossa={nossa}
                        />
                    </DialogHeader>

                    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                        {embedUrl && (
                            <div className="shrink-0 border-b border-border p-4 lg:order-last lg:min-w-0 lg:flex-1 lg:overflow-y-auto lg:border-b-0 lg:border-l lg:p-6">
                                <div className="aspect-video w-full overflow-hidden rounded-lg bg-card">
                                    <iframe
                                        src={embedUrl}
                                        className="h-full w-full"
                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={`Video: ${title}`}
                                    />
                                </div>
                            </div>
                        )}

                        <div
                            className={cn(
                                'flex min-h-0 flex-1 flex-col',
                                embedUrl && 'lg:w-[42%] lg:flex-none',
                            )}
                        >
                            {visibleTabs.length > 1 && (
                                <div
                                    role="tablist"
                                    className="flex shrink-0 border-b border-border"
                                >
                                    {visibleTabs.map(
                                        ({ id, label, icon: Icon }) => (
                                            <button
                                                key={id}
                                                type="button"
                                                role="tab"
                                                aria-selected={activeTab === id}
                                                onClick={() => setActiveTab(id)}
                                                className={cn(
                                                    'flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                                                    activeTab === id
                                                        ? 'border-b-2 border-primary text-primary'
                                                        : 'text-muted-foreground hover:text-foreground',
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {label}
                                            </button>
                                        ),
                                    )}
                                </div>
                            )}

                            <div
                                role="tabpanel"
                                className="min-h-0 flex-1 overflow-y-auto p-6"
                            >
                                {activeTab === 'lyrics' && (
                                    <pre className="font-sans leading-relaxed whitespace-pre-wrap text-foreground">
                                        {lyrics}
                                    </pre>
                                )}
                                {activeTab === 'translation' && (
                                    <pre className="font-sans leading-relaxed whitespace-pre-wrap text-foreground">
                                        {translation}
                                    </pre>
                                )}
                                {activeTab === 'history' && (
                                    <p className="leading-relaxed whitespace-pre-wrap text-foreground">
                                        {history}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
