import { Medal as MedalLucide } from 'lucide-react';
import { MEDAL_MIN_DAYS, MEDAL_STYLE } from '@/lib/retos';
import type { Medal, MedalCount } from '@/lib/retos';
import { cn } from '@/lib/utils';

export function MedalIcon({
    medal,
    className,
}: {
    medal: Medal;
    className?: string;
}) {
    return (
        <MedalLucide
            aria-label={`Medalla de ${MEDAL_STYLE[medal].label.toLowerCase()}`}
            className={cn('h-5 w-5', MEDAL_STYLE[medal].className, className)}
        />
    );
}

/** Medallas ganadas de un reto: "🥇×2 🥈×1" (solo las que tiene). */
export function MedalCounts({
    medals,
    className,
}: {
    medals: MedalCount;
    className?: string;
}) {
    const earned = MEDAL_MIN_DAYS.filter(([medal]) => medals[medal] > 0);

    if (earned.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex items-center gap-3', className)}>
            {earned.map(([medal]) => (
                <span
                    key={medal}
                    className="flex items-center gap-0.5 text-sm font-medium text-foreground"
                    title={`${medals[medal]} de ${MEDAL_STYLE[medal].label.toLowerCase()}`}
                >
                    <MedalIcon medal={medal} className="h-4 w-4" />×
                    {medals[medal]}
                </span>
            ))}
        </div>
    );
}
