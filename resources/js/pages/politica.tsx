import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { useAuth } from '@/hooks/use-auth';
import { SectionLayout } from '@/components/section-layout';
import {
    ScrollText,
    Plus,
    Loader2,
    Download,
    FileText,
    Pencil,
    Trash2,
    Upload,
    X,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PoliticaDoc {
    id: string;
    title: string;
    content: string | null;
    category: string | null;
    file_url: string | null;
    file_name: string | null;
    created_at: string;
}

const CATEGORIES = [
    'Manual de Convivencia',
    'Cordas y Graduación',
    'Reglamento',
    'Comunicados',
    'Otro',
];

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

const EMPTY_FORM = {
    title: '',
    content: '',
    category: 'Manual de Convivencia',
};

export default function PoliticaPage({ docs }: { docs: PoliticaDoc[] }) {
    const { user } = useAuth();
    const { confirm, notify } = useConfirm();
    const isAdmin = user?.role === 'admin';

    // Los documentos llegan como props de Inertia (ya cargados por el
    // servidor): no hay estado de "cargando" ni de error de carga.
    const loading = false;
    const error = '';
    const fetchDocs = () => router.reload({ only: ['docs'] });
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<PoliticaDoc | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // File upload: el archivo viaja en la misma petición que el documento
    // (el servidor decide la URL). `uploadedFile` = el archivo que ya tiene el
    // documento en edición; si se quita, se le pide al servidor que lo borre.
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<{
        url: string;
        name: string;
    } | null>(null);
    const uploading = false;

    // ── Dialog helpers ─────────────────────────────────────────────────
    const openAdd = () => {
        setEditingDoc(null);
        setForm(EMPTY_FORM);
        setPendingFile(null);
        setUploadedFile(null);
        setFormError('');
        setDialogOpen(true);
    };

    const openEdit = (doc: PoliticaDoc) => {
        setEditingDoc(doc);
        setForm({
            title: doc.title,
            content: doc.content ?? '',
            category: doc.category ?? 'Manual de Convivencia',
        });
        setPendingFile(null);
        setUploadedFile(
            doc.file_url
                ? {
                      url: doc.file_url,
                      name: doc.file_name ?? 'Archivo adjunto',
                  }
                : null,
        );
        setFormError('');
        setDialogOpen(true);
    };

    // ── File handling ──────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 20 * 1024 * 1024) {
            setFormError('El archivo no puede superar 20 MB');
            return;
        }
        setFormError('');
        setPendingFile(file);
    };

    const removeFile = () => {
        setPendingFile(null);
        setUploadedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Save (create / update) ─────────────────────────────────────────
    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        const removeExisting =
            Boolean(editingDoc?.file_url) && !uploadedFile && !pendingFile;
        const payload = {
            ...form,
            ...(pendingFile ? { file: pendingFile } : {}),
            ...(removeExisting ? { remove_file: '1' } : {}),
            // PHP no interpreta multipart/form-data en un PUT real: va como POST.
            ...(editingDoc ? { _method: 'put' } : {}),
        };

        router.post(
            editingDoc ? `/politica/${editingDoc.id}` : '/politica',
            payload,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
                onError: (errors) =>
                    setFormError(
                        Object.values(errors)[0] ?? 'Error al guardar',
                    ),
                onFinish: () => setSaving(false),
            },
        );
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

    const allCategories = ['all', ...CATEGORIES];

    // ── Render ────────────────────────────────────────────────────────
    return (
        <SectionLayout
            title="Política del Grupo"
            description="Manual de convivencia, cordas de graduación y documentos oficiales"
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
                {isAdmin && (
                    <Button onClick={openAdd} className="shrink-0 gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo documento
                    </Button>
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
                        onClick={fetchDocs}
                    >
                        Reintentar
                    </Button>
                </div>
            )}

            {!loading && !error && filteredDocs.length === 0 && (
                <div className="py-12 text-center">
                    <ScrollText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">
                        {docs.length === 0
                            ? 'Aún no hay documentos. ¡Agrega el primero!'
                            : 'No hay documentos en esta categoría.'}
                    </p>
                </div>
            )}

            {/* Documents List */}
            {!loading && !error && (
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
                                                {new Date(
                                                    doc.created_at,
                                                ).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions — solo admin. relative z-10 para quedar por
                      encima del "stretched button" del título de arriba. */}
                                    {isAdmin && (
                                        <div className="relative z-10 flex shrink-0 items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => openEdit(doc)}
                                                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                                aria-label="Editar documento"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(doc.id)
                                                }
                                                className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                aria-label="Eliminar documento"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl">
                            {editingDoc
                                ? 'Editar documento'
                                : 'Nuevo documento'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="mt-2 space-y-5">
                        {/* Título */}
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
                                placeholder="Ej: Manual de Convivencia 2024"
                            />
                        </div>

                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, category: v }))
                                }
                                disabled={saving}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Descripción */}
                        <div className="space-y-2">
                            <Label htmlFor="content">
                                Descripción (opcional)
                            </Label>
                            <Textarea
                                id="content"
                                value={form.content}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        content: e.target.value,
                                    }))
                                }
                                disabled={saving}
                                rows={4}
                                placeholder="Breve descripción del documento..."
                            />
                        </div>

                        {/* Archivo adjunto */}
                        <div className="space-y-2">
                            <Label>Archivo adjunto (opcional)</Label>

                            {/* Mostrar archivo actual o nuevo */}
                            {uploadedFile || pendingFile ? (
                                <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3">
                                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                                    <span className="flex-1 truncate text-sm text-foreground">
                                        {pendingFile
                                            ? pendingFile.name
                                            : uploadedFile?.name}
                                        {pendingFile && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                (
                                                {(
                                                    pendingFile.size / 1024
                                                ).toFixed(0)}{' '}
                                                KB)
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={removeFile}
                                        disabled={saving}
                                        className="text-muted-foreground transition-colors hover:text-destructive"
                                        aria-label="Quitar archivo"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-all hover:border-primary hover:bg-primary/5"
                                >
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-center text-sm text-muted-foreground">
                                        Haz clic para seleccionar un archivo
                                        <br />
                                        <span className="text-xs">
                                            PDF, DOC, DOCX, JPG, PNG — máx 20 MB
                                        </span>
                                    </span>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                                onChange={handleFileChange}
                                disabled={saving}
                            />

                            {!pendingFile && !uploadedFile && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={saving}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Seleccionar archivo
                                </button>
                            )}
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
                            <Button
                                type="submit"
                                disabled={saving || uploading}
                            >
                                {saving || uploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {uploading
                                            ? 'Subiendo archivo...'
                                            : 'Guardando...'}
                                    </>
                                ) : editingDoc ? (
                                    'Guardar cambios'
                                ) : (
                                    'Agregar documento'
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </SectionLayout>
    );
}
