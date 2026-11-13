import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FormError } from '@/components/form-error';
import { SubmitButton } from '@/components/submit-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { enviar, TIPOS_ABSTRACTOS } from '@/lib/portugues';
import type { Palabra, Tarjeta } from '@/types/portugues';

/**
 * Cómo suena en español, la asociación inverosímil y, para palabras
 * abstractas, una frase de ejemplo en su lugar. Guardar todo vacío deja la
 * palabra sin asociación. Quien lo usa le cambia el `key` por palabra.
 */
export function AsociacionForm({
    palabra,
    tarjeta,
    submitLabel,
    onSaved,
    actions,
}: {
    palabra: Palabra;
    tarjeta: Tarjeta | undefined;
    submitLabel: string;
    onSaved: () => void;
    /** Botones extra a la izquierda (ej. "Saltar", "Cancelar"). */
    actions?: ReactNode;
}) {
    const abstracta = TIPOS_ABSTRACTOS.includes(palabra.tipo);
    const [form, setForm] = useState({
        suena_como: tarjeta?.suena_como ?? '',
        asociacion: tarjeta?.asociacion ?? '',
        frase: tarjeta?.frase ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const id = (campo: string) => `${campo}-${palabra.id}`;

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        enviar('put', `/portugues/palabras/${palabra.id}`, form, {
            onSuccess: () => onSaved(),
            onError: (errors) =>
                setError(Object.values(errors)[0] ?? 'Error al guardar'),
            onFinish: () => setSaving(false),
        });
    };

    const frase = (
        <div className="space-y-2">
            <Label htmlFor={id('frase')}>
                Frase de ejemplo{' '}
                {abstracta ? '(en lugar de la asociación)' : '(opcional)'}
            </Label>
            <Textarea
                id={id('frase')}
                value={form.frase}
                onChange={(e) =>
                    setForm((f) => ({ ...f, frase: e.target.value }))
                }
                disabled={saving}
                rows={2}
                maxLength={1000}
                placeholder={
                    palabra.ejemplo
                        ? `Ej.: ${palabra.ejemplo}`
                        : 'Una frase corta que use la palabra'
                }
            />
            {palabra.ejemplo && !form.frase && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                        setForm((f) => ({ ...f, frase: palabra.ejemplo ?? '' }))
                    }
                    disabled={saving}
                >
                    Usar el ejemplo
                </Button>
            )}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor={id('suena')}>
                    Cómo suena en español (opcional)
                </Label>
                <Input
                    id={id('suena')}
                    value={form.suena_como}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, suena_como: e.target.value }))
                    }
                    disabled={saving}
                    maxLength={150}
                    autoComplete="off"
                    placeholder="Ej.: para «cachorro», cachojo"
                />
            </div>

            {abstracta && frase}

            <div className="space-y-2">
                <Label htmlFor={id('asociacion')}>
                    Asociación inverosímil
                    {abstracta ? ' (opcional)' : ''}
                </Label>
                <Textarea
                    id={id('asociacion')}
                    value={form.asociacion}
                    onChange={(e) =>
                        setForm((f) => ({ ...f, asociacion: e.target.value }))
                    }
                    disabled={saving}
                    rows={3}
                    maxLength={1000}
                    placeholder="La imagen más absurda que una el sonido con el significado. Ej.: un perrito se comió un cacho de jamón gigante…"
                />
            </div>

            {!abstracta && frase}

            <FormError message={error} />

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {actions}
                <SubmitButton processing={saving}>{submitLabel}</SubmitButton>
            </div>
        </form>
    );
}
