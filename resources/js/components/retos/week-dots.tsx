import { Check } from 'lucide-react';
import { weekdayShort } from '@/lib/calendar';
import { weekDates } from '@/lib/retos';
import type { SemanaActiva } from '@/lib/retos';
import { cn } from '@/lib/utils';

/**
 * Los 7 días de la semana de un reto: los entrenados con ✓, hoy con borde
 * y los que ya pasaron sin entrenar, apagados.
 */
export function WeekDots({
    semana,
    today,
}: {
    semana: SemanaActiva;
    today: string;
}) {
    return (
        <ol className="flex gap-1.5" aria-label="Días de la semana del reto">
            {weekDates(semana.starts_on).map((date) => {
                const done = semana.days_done.includes(date);
                const isToday = date === today;
                const missed = !done && date < today;

                return (
                    <li
                        key={date}
                        className="flex flex-col items-center gap-1"
                        aria-label={`${weekdayShort(date)}: ${done ? 'entrenado' : missed ? 'sin entrenar' : isToday ? 'hoy' : 'pendiente'}`}
                    >
                        <span
                            className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full border text-xs',
                                done &&
                                    'border-primary bg-primary text-primary-foreground',
                                !done &&
                                    isToday &&
                                    'border-2 border-primary text-primary',
                                missed && 'border-border bg-secondary/40',
                                !done && !isToday && !missed && 'border-border',
                            )}
                        >
                            {done && <Check className="h-4 w-4" />}
                        </span>
                        <span
                            className={cn(
                                'text-[10px] text-muted-foreground',
                                isToday && 'font-semibold text-primary',
                            )}
                        >
                            {weekdayShort(date)}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
