import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CalendarEvent } from '@/lib/calendar';
import { WEEKDAYS } from '@/lib/calendar';
import { cn } from '@/lib/utils';

function emptyForm(date: string) {
    return {
        title: '',
        description: '',
        location: '',
        starts_on: date,
        ends_on: '',
        all_day: false,
        start_time: '',
        end_time: '',
        /** Sin repetir: si termina otro día (evento de varios días). */
        multi_day: false,
        repeats: false,
        repeat_days: [] as number[],
    };
}

function formFrom(e: CalendarEvent) {
    return {
        title: e.title,
        description: e.description ?? '',
        location: e.location ?? '',
        starts_on: e.starts_on,
        ends_on: e.ends_on ?? '',
        all_day: !e.start_time,
        start_time: e.start_time ?? '',
        end_time: e.end_time ?? '',
        multi_day: !e.repeat_days && !!e.ends_on,
        repeats: !!e.repeat_days,
        repeat_days: e.repeat_days ?? [],
    };
}

/** Crear o editar un evento (quien tenga `eventos.gestionar`). */
export function EventFormDialog({
    open,
    onOpenChange,
    editing,
    defaultDate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editing: CalendarEvent | null;
    defaultDate: string;
}) {
    // Arranca con los datos del evento (o vacío): quien lo usa le cambia el
    // `key` en cada apertura para que empiece de cero.
    const form = useForm(editing ? formFrom(editing) : emptyForm(defaultDate));
    const { data } = form;

    const toggleDay = (iso: number) =>
        form.setData(
            'repeat_days',
            data.repeat_days.includes(iso)
                ? data.repeat_days.filter((d) => d !== iso)
                : [...data.repeat_days, iso],
        );

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.transform((d) => ({
            title: d.title,
            description: d.description || null,
            location: d.location || null,
            starts_on: d.starts_on,
            ends_on: d.repeats || d.multi_day ? d.ends_on || null : null,
            start_time: d.all_day ? null : d.start_time || null,
            end_time: d.all_day ? null : d.end_time || null,
            repeat_days: d.repeats ? d.repeat_days : [],
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => onOpenChange(false),
        };

        if (editing) {
            form.put(`/eventos/${editing.id}`, options);
        } else {
            form.post('/eventos', options);
        }
    };

    const formError = Object.values(form.errors)[0];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                        {editing ? 'Editar evento' : 'Nuevo evento'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ev-title">Título *</Label>
                        <Input
                            id="ev-title"
                            value={data.title}
                            onChange={(e) =>
                                form.setData('title', e.target.value)
                            }
                            required
                            maxLength={255}
                            disabled={form.processing}
                            placeholder="Ej: Clase de Angola"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ev-location">Lugar (opcional)</Label>
                        <Input
                            id="ev-location"
                            value={data.location}
                            onChange={(e) =>
                                form.setData('location', e.target.value)
                            }
                            maxLength={255}
                            disabled={form.processing}
                            placeholder="Ej: Academia, Parque Central"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ev-starts">
                                {data.repeats || data.multi_day
                                    ? 'Desde *'
                                    : 'Fecha *'}
                            </Label>
                            <Input
                                id="ev-starts"
                                type="date"
                                value={data.starts_on}
                                onChange={(e) =>
                                    form.setData('starts_on', e.target.value)
                                }
                                required
                                disabled={form.processing}
                            />
                        </div>
                        {(data.repeats || data.multi_day) && (
                            <div className="space-y-2">
                                <Label htmlFor="ev-ends">Hasta *</Label>
                                <Input
                                    id="ev-ends"
                                    type="date"
                                    value={data.ends_on}
                                    min={data.starts_on}
                                    onChange={(e) =>
                                        form.setData('ends_on', e.target.value)
                                    }
                                    required
                                    disabled={form.processing}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 rounded-lg border border-border p-3">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="ev-repeats"
                                checked={data.repeats}
                                onCheckedChange={(v) =>
                                    form.setData((d) => ({
                                        ...d,
                                        repeats: v === true,
                                        multi_day: false,
                                    }))
                                }
                                disabled={form.processing}
                            />
                            <Label
                                htmlFor="ev-repeats"
                                className="cursor-pointer"
                            >
                                Se repite cada semana
                            </Label>
                        </div>

                        {data.repeats ? (
                            <div
                                className="flex flex-wrap gap-1.5"
                                role="group"
                                aria-label="Días en que se repite"
                            >
                                {WEEKDAYS.map((d) => {
                                    const on = data.repeat_days.includes(d.iso);

                                    return (
                                        <button
                                            key={d.iso}
                                            type="button"
                                            onClick={() => toggleDay(d.iso)}
                                            disabled={form.processing}
                                            aria-pressed={on}
                                            aria-label={d.label}
                                            title={d.label}
                                            className={cn(
                                                'h-9 min-w-9 rounded-md border px-2 text-sm font-medium transition-colors',
                                                on
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border text-muted-foreground hover:border-primary hover:text-foreground',
                                            )}
                                        >
                                            {d.short}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="ev-multi"
                                    checked={data.multi_day}
                                    onCheckedChange={(v) =>
                                        form.setData('multi_day', v === true)
                                    }
                                    disabled={form.processing}
                                />
                                <Label
                                    htmlFor="ev-multi"
                                    className="cursor-pointer"
                                >
                                    Dura varios días seguidos
                                </Label>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="ev-allday"
                                checked={data.all_day}
                                onCheckedChange={(v) =>
                                    form.setData('all_day', v === true)
                                }
                                disabled={form.processing}
                            />
                            <Label
                                htmlFor="ev-allday"
                                className="cursor-pointer"
                            >
                                Todo el día
                            </Label>
                        </div>
                        {!data.all_day && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ev-start-time">
                                        Hora de inicio *
                                    </Label>
                                    <Input
                                        id="ev-start-time"
                                        type="time"
                                        value={data.start_time}
                                        onChange={(e) =>
                                            form.setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        disabled={form.processing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ev-end-time">
                                        Hora de fin
                                    </Label>
                                    <Input
                                        id="ev-end-time"
                                        type="time"
                                        value={data.end_time}
                                        onChange={(e) =>
                                            form.setData(
                                                'end_time',
                                                e.target.value,
                                            )
                                        }
                                        disabled={form.processing}
                                    />
                                </div>
                                <p className="col-span-2 -mt-2 text-xs text-muted-foreground">
                                    Hora de Colombia
                                    {data.repeats || data.multi_day
                                        ? ', la misma para cada día.'
                                        : '.'}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ev-description">
                            Descripción (opcional)
                        </Label>
                        <Textarea
                            id="ev-description"
                            value={data.description}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            maxLength={5000}
                            rows={3}
                            disabled={form.processing}
                            placeholder="Qué traer, a quién está dirigido…"
                        />
                    </div>

                    {formError && (
                        <p
                            role="alert"
                            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                        >
                            {formError}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : editing ? (
                                'Guardar cambios'
                            ) : (
                                'Crear evento'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
