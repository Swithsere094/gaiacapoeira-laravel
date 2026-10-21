import { Link } from '@inertiajs/react';
import { MedalBadge } from '@/components/retos/medals';
import { categoryIcon, skillIcon } from '@/lib/icons';
import { MEDAL_MIN_DAYS, MEDAL_STYLE, TREE_LABELS } from '@/lib/retos';
import type { Medal } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Un reto semanal en la vitrina (ProfileController::medallas). */
export interface Medalla {
    id: string;
    title: string;
    group: 'movimiento' | 'musicalidad' | 'sueltos';
    habilidad: string | null;
    icon: string | null;
    category: string | null;
    oro: number;
    plata: number;
    bronce: number;
}

const GROUPS = [
    { id: 'movimiento', label: TREE_LABELS.movimiento },
    { id: 'musicalidad', label: TREE_LABELS.musicalidad },
    { id: 'sueltos', label: 'Retos sueltos' },
] as const;

/** La mejor medalla ganada en ese reto (null = por ganar). */
function best(m: Medalla): Medal | null {
    return MEDAL_MIN_DAYS.find(([medal]) => m[medal] > 0)?.[0] ?? null;
}

/**
 * Vitrina: todas las medallas posibles, una por reto semanal. Las ganadas se
 * ven en su metal (la mejor) con cuántas veces; las demás, apagadas.
 */
export function MedalShowcase({ medallas }: { medallas: Medalla[] }) {
    const totals = MEDAL_MIN_DAYS.map(
        ([medal]) =>
            [medal, medallas.reduce((n, m) => n + m[medal], 0)] as const,
    );
    const earned = medallas.filter((m) => best(m) !== null).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {earned === 0 ? (
                        <>
                            Todavía no tienes medallas.{' '}
                            <Link
                                href="/retos"
                                className="font-medium text-primary"
                            >
                                Acepta un reto
                            </Link>
                            .
                        </>
                    ) : (
                        `Medalla en ${earned} de ${medallas.length} retos`
                    )}
                </p>
                <div className="flex items-end gap-4">
                    {totals.map(([medal, n]) => (
                        <span
                            key={medal}
                            className="flex items-end gap-1 text-sm font-semibold text-foreground"
                            title={`${n} de ${MEDAL_STYLE[medal].label.toLowerCase()}`}
                        >
                            <MedalBadge
                                medal={n > 0 ? medal : null}
                                size={22}
                            />
                            {n}
                        </span>
                    ))}
                </div>
            </div>

            {GROUPS.map((group) => {
                const items = medallas.filter((m) => m.group === group.id);

                if (items.length === 0) {
                    return null;
                }

                return (
                    <section key={group.id}>
                        <h3 className="mb-3 text-xs font-semibold tracking-wide text-primary uppercase">
                            {group.label}
                        </h3>
                        <ul className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-5">
                            {items.map((m) => {
                                const medal = best(m);
                                const icon = m.habilidad
                                    ? skillIcon(m.icon)
                                    : categoryIcon(m.category);

                                return (
                                    <li
                                        key={m.id}
                                        className="flex flex-col items-center gap-1.5 text-center"
                                        title={m.title}
                                    >
                                        <MedalBadge
                                            medal={medal}
                                            icon={icon}
                                            size={46}
                                            className={cn(
                                                !medal && 'opacity-60',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'line-clamp-2 text-xs leading-tight',
                                                medal
                                                    ? 'font-medium text-foreground'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {m.habilidad ?? m.title}
                                        </span>
                                        {medal && (
                                            <span className="text-[10px] text-muted-foreground">
                                                {MEDAL_MIN_DAYS.filter(
                                                    ([x]) => m[x] > 0,
                                                )
                                                    .map(
                                                        ([x]) =>
                                                            `${MEDAL_STYLE[x].label} ×${m[x]}`,
                                                    )
                                                    .join(' · ')}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                );
            })}
        </div>
    );
}
