import { MedalIcon } from '@/components/retos/medals';
import { MEDAL_MIN_DAYS, WEEK_DAYS } from '@/lib/retos';

/**
 * Barra de la semana (0 a 7 días) con las marcas de cada medalla en 4, 5 y 6:
 * se ve cuánto falta para la siguiente.
 */
export function WeekMedalBar({ days }: { days: number }) {
    const pct = (n: number) => `${(n / WEEK_DAYS) * 100}%`;

    return (
        <div className="pt-5" aria-hidden="true">
            <div className="relative h-2 rounded-full bg-secondary">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700"
                    style={{ width: pct(Math.min(days, WEEK_DAYS)) }}
                />
                {MEDAL_MIN_DAYS.map(([medal, min]) => (
                    <span
                        key={medal}
                        className="absolute bottom-full mb-0.5 -translate-x-1/2"
                        style={{ left: pct(min) }}
                    >
                        <span
                            className={
                                days >= min ? '' : 'opacity-40 grayscale'
                            }
                        >
                            <MedalIcon medal={medal} size={14} />
                        </span>
                    </span>
                ))}
                {MEDAL_MIN_DAYS.map(([medal, min]) => (
                    <span
                        key={`${medal}-tick`}
                        className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background/70"
                        style={{ left: pct(min) }}
                    />
                ))}
            </div>
        </div>
    );
}
