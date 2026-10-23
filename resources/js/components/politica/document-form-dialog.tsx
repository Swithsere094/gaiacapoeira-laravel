import { router } from '@inertiajs/react';
import { FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FormActions } from '@/components/form-actions';
import { FormError } from '@/components/form-error';
import { IconButton } from '@/components/icon-button';
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
import { POLITICA_CATEGORIES } from '@/lib/constants/politica';
import type { PoliticaDoc } from '@/types/politica';

/**
 * Crear o editar un documento de política (permiso `politica.gestionar`).
 * El archivo viaja en la misma petición que el documento y la URL la decide
 * el servidor. Arranca con los datos del documento (o vacío): quien lo usa le
 * cambia el `key` en cada apertura.
 */
export function DocumentFormDialog({
    open,
    onOpenChange,
    editing,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: PoliticaDoc | null;
}) {
    const [form, setForm] = useState({
        title: editing?.title ?? '',
        content: editing?.content ?? '',
        category: editing?.category ?? 'Manual de Convivencia',
    });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // `uploadedFile` = el archivo que ya tiene el documento en edición; si se
    // quita, se le pide al servidor que lo borre.
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState(
        editing?.file_url
            ? {
                  url: editing.file_url,
                  name: editing.file_name ?? 'Archivo adjunto',
              }
            : null,
    );

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

    const handleSave = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError('');
        setSaving(true);

        const removeExisting =
            Boolean(editing?.file_url) && !uploadedFile && !pendingFile;
        const payload = {
            ...form,
            ...(pendingFile ? { file: pendingFile } : {}),
            ...(removeExisting ? { remove_file: '1' } : {}),
            // PHP no interpreta multipart/form-data en un PUT real: va como POST.
            ...(editing ? { _method: 'put' } : {}),
        };

        router.post(
            editing ? `/politica/${editing.id}` : '/politica',
            payload,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onError: (errors) =>
                    setFormError(
                        Object.values(errors)[0] ?? 'Error al guardar',
                    ),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editing ? 'Editar documento' : 'Nuevo documento'}
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
                            placeholder="Ej.: Manual de Convivencia 2024"
                        />
                    </div>

                    {/* Categoría */}
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría *</Label>
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
                                {POLITICA_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Descripción (opcional)</Label>
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
                            placeholder="Breve descripción del documento…"
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
                                            {(pendingFile.size / 1024).toFixed(
                                                0,
                                            )}{' '}
                                            KB)
                                        </span>
                                    )}
                                </span>
                                <IconButton
                                    icon={X}
                                    label="Quitar archivo"
                                    tone="destructive"
                                    size="sm"
                                    onClick={removeFile}
                                    disabled={saving}
                                />
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
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
                                onClick={() => fileInputRef.current?.click()}
                                disabled={saving}
                                className="text-xs text-primary hover:underline"
                            >
                                Seleccionar archivo
                            </button>
                        )}
                    </div>

                    <FormError message={formError} />

                    <FormActions
                        onCancel={() => onOpenChange(false)}
                        processing={saving}
                        pendingLabel={
                            pendingFile ? 'Subiendo archivo…' : 'Guardando…'
                        }
                    >
                        {editing ? 'Guardar cambios' : 'Crear documento'}
                    </FormActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
