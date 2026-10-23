import { Link } from '@inertiajs/react';
import { CheckCircle2, Play } from 'lucide-react';
import { MedalBadge } from '@/components/retos/medals';
import { IconBadge, retoIcon } from '@/components/retos/reto-icon';
import { WeekDots } from '@/components/retos/week-dots';
import { WeekMedalBar } from '@/components/retos/week-medal-bar';
import { Button } from '@/components/ui/button';
import {
    CATEGORY_LABELS,
    TREE_LABELS,
    WEEK_DAYS,
    formatMinutes,
    weekStatus,
} from '@/lib/retos';
import type { SemanaActiva } from '@/lib/retos';

/** De qué es el reto: "Movimiento · Ginga" o "Flexibilidad". */
export function retoContext(reto: SemanaActiva['reto']): string {
    if (reto.habilidad) {
        return `${TREE_LABELS[reto.habilidad.tree]} · ${reto.habilidad.name}`;
    }

    return CATEGORY_LABELS[reto.category ?? ''] ?? 'Entrenar';
}

/** Un reto en curso: días de la semana, cómo va y el botón de entrenar. */
export function ActiveWeekCard({
    semana,
    today,
    onAbandon,
}: {
    semana: SemanaActiva;
    today: string;
    onAbandon?: (semana: SemanaActiva) => void;
}) {
    const days = semana.days_done.length;

    return (
        <div className="flex flex-col gap-4 panel p-5">
            <div className="flex items-start gap-3">
                <IconBadge icon={retoIcon(semana.reto)} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                        {retoContext(semana.reto)}
                    </p>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                        {semana.reto.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Día {Math.min(semana.day, WEEK_DAYS)} de {WEEK_DAYS} ·{' '}
                        {formatMinutes(semana.reto.minutes)} por día
                    </p>
                </div>
                {semana.medal_so_far && (
                    <MedalBadge
                        medal={semana.medal_so_far}
                        icon={retoIcon(semana.reto)}
                        size={34}
                        shine
                    />
                )}
            </div>

            <WeekDots semana={semana} today={today} />
            <WeekMedalBar days={days} />

            <p className="text-sm font-medium text-foreground">
                {days} de {WEEK_DAYS} días · {weekStatus(days)}
            </p>

            {semana.trained_today && (
                <p className="-mt-2 flex items-center gap-1.5 text-sm text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    Ya entrenaste hoy
                </p>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2">
                <Button
                    asChild
                    variant={semana.trained_today ? 'outline' : 'default'}
                    size="sm"
                    className="gap-1.5"
                >
                    <Link href={`/retos/${semana.reto.id}/entrenar`}>
                        <Play className="h-4 w-4" />
                        {semana.trained_today
                            ? 'Entrenar otra vez'
                            : 'Entrenar'}
                    </Link>
                </Button>
                {onAbandon && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => onAbandon(semana)}
                    >
                        Abandonar
                    </Button>
                )}
            </div>
        </div>
    );
}
