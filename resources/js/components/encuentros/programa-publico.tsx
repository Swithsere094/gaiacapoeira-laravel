import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { PanelTitle } from '@/components/headings';
import { formatDate } from '@/lib/dates';
import { agruparPorDia, formatHorario } from '@/lib/encuentros';
import { cn } from '@/lib/utils';
import type { Actividad } from '@/types/encuentros';

/**
 * Programación en la página pública: pestañas por día (si hay más de uno)
 * y la lista de actividades con su horario.
 */
export function ProgramaPublico({ actividades }: { actividades: Actividad[] }) {
    const dias = agruparPorDia(actividades);
    const [elegido, setElegido] = useState(dias[0]?.[0] ?? '');
    const actual = dias.find(([dia]) => dia === elegido) ?? dias[0];

    if (!actual) {
        return null;
    }

    return (
        <section className="space-y-3">
            <PanelTitle icon={CalendarClock}>Programación</PanelTitle>
            {dias.length > 1 && (
                <div
                    role="tablist"
                    aria-label="Días del encuentro"
                    className="flex gap-2 overflow-x-auto pb-1"
                >
                    {dias.map(([dia]) => (
                        <button
                            key={dia}
                            type="button"
                            role="tab"
                            aria-selected={dia === actual[0]}
                            onClick={() => setElegido(dia)}
                            className={cn(
                                'shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors',
                                dia === actual[0]
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground',
                            )}
                        >
                            {formatDate(dia, 'weekday')}
                        </button>
                    ))}
                </div>
            )}
            <div className="panel p-2 sm:p-3" role="tabpanel">
                {dias.length === 1 && (
                    <p className="px-3 pt-2 pb-1 text-sm font-medium text-primary">
                        {formatDate(actual[0], 'weekday')}
                    </p>
                )}
                <ol className="divide-y divide-border">
                    {actual[1].map((a) => {
                        const horario = formatHorario(a);

                        return (
                            <li
                                key={a.id}
                                className="grid gap-1 px-3 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4"
                            >
                                <span className="text-sm text-muted-foreground tabular-nums">
                                    {horario || 'Durante el día'}
                                </span>
                                <span>
                                    <span className="block font-medium text-foreground">
                                        {a.titulo}
                                    </span>
                                    {a.descripcion && (
                                        <span className="block text-sm text-muted-foreground">
                                            {a.descripcion}
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}
