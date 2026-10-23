import { router } from '@inertiajs/react';
import {
    ScrollText,
    Plus,
    Download,
    FileText,
    Pencil,
    Trash2,
    Filter,
} from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { IconButton } from '@/components/icon-button';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { DocumentFormDialog } from '@/components/politica/document-form-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { POLITICA_CATEGORIES } from '@/lib/constants/politica';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { PoliticaDoc } from '@/types/politica';

// text-foreground a propósito (no el color de la categoría): text-{color}
// sobre bg-{color}/20 no cumple el contraste mínimo de WCAG AA — ver
// auditoría de accesibilidad. El color queda solo en el fondo.
const categoryColors: Record<string, string> = {
    'Manual de Convivencia': 'bg-primary/20 text-foreground',
    'Cordas y Graduación': 'bg-chart-5/20 text-foreground',
    Reglamento: 'bg-chart-4/20 text-foreground',
    Comunicados: 'bg-accent/20 text-foreground',
    Otro: 'bg-secondary text-secondary-foreground',
};

export default function PoliticaPage({ docs }: { docs: PoliticaDoc[] }) {
    const { can } = useAuth();
    const { confirm, notify } = useConfirm();
    const canManage = can('politica.gestionar');

    const [selectedCategory, setSelectedCategory] = useState('all');

    // Formulario (se remonta con `key` en cada apertura).
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<PoliticaDoc | null>(null);
    const [formKey, setFormKey] = useState(0);

    const openForm = (doc: PoliticaDoc | null) => {
        setEditingDoc(doc);
        setFormKey((k) => k + 1);
        setDialogOpen(true);
    };

    // ── Delete ─────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        const ok = await confirm({
            title: '¿Eliminar este documento?',
            description: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });
        if (!ok) return;
        router.delete(`/politica/${id}`, {
            preserveScroll: true,
            onError: () =>
                void notify({ title: 'No se pudo eliminar el documento.' }),
        });
    };

    // ── Filter ────────────────────────────────────────────────────────
    const filteredDocs =
        selectedCategory === 'all'
            ? docs
            : docs.filter((d) => d.category === selectedCategory);

    const allCategories = ['all', ...POLITICA_CATEGORIES];

    // ── Render ────────────────────────────────────────────────────────
    return (
        <PageLayout
            title="Política del grupo"
            header={
                <PageHeader
                    icon={ScrollText}
                    title="Política del grupo"
                    description="Manual de convivencia, cordas de graduación y documentos oficiales"
                />
            }
        >
            {/* Filter + Add button */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
                <Filter className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
                    {allCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedCategory === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                            }`}
                        >
                            {cat === 'all' ? 'Todos' : cat}
                        </button>
                    ))}
                </div>
                {canManage && (
                    <Button
                        onClick={() => openForm(null)}
                        className="shrink-0 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo documento
                    </Button>
                )}
            </div>

            {filteredDocs.length === 0 && (
                <EmptyState icon={ScrollText}>
                    {docs.length === 0
                        ? 'Aún no hay documentos. ¡Agrega el primero!'
                        : 'No hay documentos en esta categoría.'}
                </EmptyState>
            )}

            {/* Documents List */}
            {filteredDocs.length > 0 && (
                <div className="space-y-4">
                    {filteredDocs.map((doc) => {
                        // Cordas y Manual de Convivencia ya no se sirven como PDF subido
                        // (se perdía en cada reinicio de la instancia en Hostinger) —
                        // ahora son páginas propias con el contenido versionado en el repo.
                        const isCordas = doc.category === 'Cordas y Graduación';
                        const isManual =
                            doc.category === 'Manual de Convivencia';
                        const isClickable =
                            isCordas || isManual || Boolean(doc.file_url);
                        const openFile = () => {
                            if (isCordas) {
                                router.visit('/politica/cordas');
                                return;
                            }
                            if (isManual) {
                                router.visit('/politica/manual');
                                return;
                            }
                            if (doc.file_url)
                                window.open(
                                    doc.file_url,
                                    '_blank',
                                    'noopener,noreferrer',
                                );
                        };
                        return (
                            <article
                                key={doc.id}
                                className={cn(
                                    'relative rounded-xl bg-card p-6 transition-colors',
                                    isClickable && 'hover:bg-secondary/40',
                                )}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                        {/* Icon */}
                                        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-chart-4/20">
                                            <FileText className="h-5 w-5 text-chart-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            {/* Category badge */}
                                            {doc.category && (
                                                <span
                                                    className={cn(
                                                        'mb-2 inline-block rounded px-2 py-0.5 text-xs font-medium',
                                                        categoryColors[
                                                            doc.category
                                                        ] ??
                                                            'bg-secondary text-secondary-foreground',
                                                    )}
                                                >
                                                    {doc.category}
                                                </span>
                                            )}

                                            <h2 className="font-serif text-lg font-bold break-words text-card-foreground">
                                                {isClickable ? (
                                                    // "Stretched button": este es el único control real
                                                    // de la tarjeta; after:inset-0 lo estira para cubrir
                                                    // toda el article (que tiene position: relative), así
                                                    // se puede seguir haciendo clic en cualquier parte de
                                                    // la tarjeta sin que sea ella misma un botón (evita
                                                    // anidar controles interactivos, ver auditoría a11y).
                                                    <button
                                                        type="button"
                                                        onClick={openFile}
                                                        className="cursor-pointer text-left after:absolute after:inset-0"
                                                    >
                                                        {doc.title}
                                                    </button>
                                                ) : (
                                                    doc.title
                                                )}
                                            </h2>

                                            {doc.content && (
                                                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                    {doc.content}
                                                </p>
                                            )}

                                            {isClickable && (
                                                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                                                    <Download className="h-3.5 w-3.5 shrink-0" />
                                                    {isCordas
                                                        ? 'Ver sistema de cordas'
                                                        : isManual
                                                          ? 'Ver manual de convivencia'
                                                          : 'Ver documento'}
                                                </span>
                                            )}

                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {formatDate(doc.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions — solo admin. relative z-10 para quedar por
                      encima del "stretched button" del título de arriba. */}
                                    {canManage && (
                                        <div className="relative z-10 flex shrink-0 items-center gap-1">
                                            <IconButton
                                                icon={Pencil}
                                                label="Editar documento"
                                                size="sm"
                                                onClick={() => openForm(doc)}
                                            />
                                            <IconButton
                                                icon={Trash2}
                                                label="Eliminar documento"
                                                tone="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(doc.id)
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Dialog */}
            {canManage && (
                <DocumentFormDialog
                    key={formKey}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    editing={editingDoc}
                />
            )}
        </PageLayout>
    );
}
