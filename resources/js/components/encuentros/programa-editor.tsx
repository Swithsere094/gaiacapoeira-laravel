import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { PanelTitle } from '@/components/headings';
import { IconButton } from '@/components/icon-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/dates';
import type { Actividad } from '@/types/encuentros';

export interface ActividadForm {
    id: string | null;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    titulo: string;
    descripcion: string;
}

export const toActividadForm = (a: Actividad): ActividadForm => ({
    id: a.id,
    fecha: a.fecha,
    hora_inicio: a.hora_inicio ?? '',
    hora_fin: a.hora_fin ?? '',
    titulo: a.titulo,
    descripcion: a.descripcion ?? '',
});

/**
 * Programación del encuentro en el formulario: una fila por actividad, con
 * el día elegido de entre los días del encuentro. Al guardar, el servidor
 * las ordena por día y hora.
 */
export function ProgramaEditor({
    actividades,
    dias,
    onChange,
}: {
    actividades: ActividadForm[];
    /** Días del encuentro (Y-m-d); vacío mientras no haya fecha de inicio. */
    dias: string[];
    onChange: (actividades: ActividadForm[]) => void;
}) {
    const set = (i: number, field: keyof ActividadForm, value: string) =>
        onChange(
            actividades.map((a, idx) =>
                idx === i ? { ...a, [field]: value } : a,
            ),
        );

    const agregar = () => {
        // La nueva arranca en el mismo día que la anterior.
        const ultima = actividades.at(-1);
        onChange([
            ...actividades,
            {
                id: null,
                fecha: ultima?.fecha ?? dias[0] ?? '',
                hora_inicio: '',
                hora_fin: '',
                titulo: '',
                descripcion: '',
            },
        ]);
    };

    return (
        <section className="space-y-4 panel p-5">
            <div>
                <PanelTitle icon={CalendarClock}>
                    Programación (opcional)
                </PanelTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                    Rodas, talleres, batizado… Sin hora, se muestra como
                    actividad del día.
                </p>
            </div>
            {actividades.length > 0 && dias.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    Pon primero la fecha de inicio del encuentro.
                </p>
            )}
            {actividades.map((a, i) => (
                <div
                    key={a.id ?? `nueva-${i}`}
                    className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto]"
                >
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_7rem]">
                            <select
                                aria-label={`Día de la actividad ${i + 1}`}
                                value={a.fecha}
                                onChange={(e) =>
                                    set(i, 'fecha', e.target.value)
                                }
                                required
                                className="col-span-2 h-9 rounded-md border border-input bg-transparent px-3 text-sm text-foreground sm:col-span-1"
                            >
                                {!dias.includes(a.fecha) && (
                                    <option value={a.fecha}>
                                        {a.fecha
                                            ? `${formatDate(a.fecha)} (fuera de las fechas)`
                                            : 'Elige el día'}
                                    </option>
                                )}
                                {dias.map((dia) => (
                                    <option key={dia} value={dia}>
                                        {formatDate(dia, 'weekday')}
                                    </option>
                                ))}
                            </select>
                            <Input
                                aria-label={`Hora de inicio de la actividad ${i + 1}`}
                                type="time"
                                value={a.hora_inicio}
                                onChange={(e) =>
                                    set(i, 'hora_inicio', e.target.value)
                                }
                            />
                            <Input
                                aria-label={`Hora de fin de la actividad ${i + 1}`}
                                type="time"
                                value={a.hora_fin}
                                min={a.hora_inicio || undefined}
                                onChange={(e) =>
                                    set(i, 'hora_fin', e.target.value)
                                }
                            />
                        </div>
                        <Input
                            aria-label={`Título de la actividad ${i + 1}`}
                            value={a.titulo}
                            onChange={(e) => set(i, 'titulo', e.target.value)}
                            required
                            maxLength={150}
                            placeholder="Ej.: Roda de apertura"
                        />
                        <Input
                            aria-label={`Detalle de la actividad ${i + 1}`}
                            value={a.descripcion}
                            onChange={(e) =>
                                set(i, 'descripcion', e.target.value)
                            }
                            maxLength={300}
                            placeholder="Detalle (opcional): lugar, quién la dirige…"
                        />
                    </div>
                    <IconButton
                        icon={Trash2}
                        label={`Quitar la actividad ${i + 1}`}
                        tone="destructive"
                        onClick={() =>
                            onChange(actividades.filter((_, idx) => idx !== i))
                        }
                        className="self-start"
                    />
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={agregar}
            >
                <Plus className="h-4 w-4" />
                Agregar actividad
            </Button>
        </section>
    );
}
