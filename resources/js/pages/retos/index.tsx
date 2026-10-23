import { Link, router } from '@inertiajs/react';
import { Dumbbell, Lock, Sparkles, Target, Trophy } from 'lucide-react';
import { useConfirm } from '@/components/confirm-dialog';
import { FlashMessage } from '@/components/flash-message';
import { SectionTitle } from '@/components/headings';
import { ActiveWeekCard } from '@/components/retos/active-week-card';
import { CelebrationDialog } from '@/components/retos/celebration-dialog';
import { DemoBar } from '@/components/retos/demo-bar';
import { MedalCounts, MedalIcon } from '@/components/retos/medals';
import { TreeProgressRings } from '@/components/retos/progress-ring';
import { IconBadge } from '@/components/retos/reto-icon';
import { RetosLayout } from '@/components/retos/retos-layout';
import { SecretTeaser } from '@/components/retos/secret-teaser';
import { Button } from '@/components/ui/button';
import { shortDate } from '@/lib/calendar';
import type { Celebration, TreeProgress } from '@/lib/celebraciones';
import { categoryIcon, skillIcon } from '@/lib/icons';
import {
    CATEGORY_LABELS,
    MEDAL_STYLE,
    TREE_LABELS,
    formatMinutes,
} from '@/lib/retos';
import type {
    HabilidadFrontera,
    RetoResumen,
    RetoSuelto,
    RetosDemoState,
    SemanaActiva,
    SemanaTerminada,
    Tree,
} from '@/lib/retos';

interface Props {
    active: SemanaActiva[];
    /** Null sin el permiso del árbol. */
    frontier: HabilidadFrontera[] | null;
    /** Los retos de Entrenar (null sin su permiso). */
    sueltos: RetoSuelto[] | null;
    finished: SemanaTerminada[];
    pending_reviews: number;
    progress: TreeProgress | null;
    today: string;
    celebrations: Celebration[];
    /** Controles de prueba (null si no es admin). */
    demo: RetosDemoState | null;
}

export default function RetosPage({
    active,
    frontier,
    sueltos,
    finished,
    pending_reviews,
    progress,
    today,
    celebrations,
    demo,
}: Props) {
    const { confirm } = useConfirm();

    const abandon = async (semana: SemanaActiva) => {
        const ok = await confirm({
            title: `¿Abandonar «${semana.reto.title}»?`,
            description:
                'Esta semana no va a contar para medallas. Puedes volver a aceptar el reto cuando quieras.',
            confirmLabel: 'Abandonar',
            destructive: true,
        });

        if (ok) {
            router.post(
                `/retos/semanas/${semana.id}/abandonar`,
                {},
                { preserveScroll: true },
            );
        }
    };

    const trees: Tree[] = ['movimiento', 'musicalidad'];

    return (
        <RetosLayout
            title="Retos"
            width="wide"
            pendingReviews={pending_reviews}
            className="space-y-10"
            description={
                <>
                    Acepta un reto y entrena durante 7 días. Con 4 días ganas
                    bronce, con 5 plata y con 6 o 7 oro.
                </>
            }
        >
            {progress && <TreeProgressRings progress={progress} />}

            {demo && <DemoBar demo={demo} />}
            <FlashMessage />

            {/* ── En curso ── */}
            <section>
                <SectionTitle icon={Target} subtitle="Tus retos de esta semana">
                    En curso
                </SectionTitle>
                {active.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                        No tienes retos en curso. Elige uno de los de abajo.
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {active.map((semana) => (
                            <ActiveWeekCard
                                key={semana.id}
                                semana={semana}
                                today={today}
                                onAbandon={(s) => void abandon(s)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Del árbol ── */}
            {frontier && (
                <section>
                    <SectionTitle
                        icon={Sparkles}
                        subtitle="Las habilidades que tienes desbloqueadas. Puedes trabajar una o varias a la vez."
                    >
                        Para avanzar en el árbol
                    </SectionTitle>
                    <div className="grid gap-8 lg:grid-cols-2">
                        {trees.map((tree) => {
                            const skills = frontier.filter(
                                (s) => s.tree === tree,
                            );

                            return (
                                <div key={tree}>
                                    <h3 className="mb-3 text-sm font-semibold tracking-wide text-primary uppercase">
                                        {TREE_LABELS[tree]}
                                    </h3>
                                    {skills.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No hay habilidades disponibles en
                                            este árbol.
                                        </p>
                                    ) : (
                                        <div className="grid gap-4">
                                            {skills.map((skill) => (
                                                <SkillCard
                                                    key={skill.id}
                                                    skill={skill}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Entrenar (en la base, kind = suelto) ── */}
            {sueltos && (
                <section>
                    <SectionTitle
                        icon={Dumbbell}
                        subtitle="Flexibilidad, fuerza, resistencia y más. Cada reto da su medalla."
                    >
                        Entrenar
                    </SectionTitle>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sueltos.map((reto) => (
                            <div
                                key={reto.id}
                                className="flex flex-col gap-3 panel p-5"
                            >
                                <div>
                                    <IconBadge
                                        icon={categoryIcon(reto.category)}
                                        className="mb-3"
                                    />
                                    <p className="text-xs font-medium tracking-wide text-primary uppercase">
                                        {CATEGORY_LABELS[reto.category ?? ''] ??
                                            'Entrenar'}
                                    </p>
                                    <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                                        {reto.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {formatMinutes(reto.minutes)} por día
                                    </p>
                                    {reto.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {reto.description}
                                        </p>
                                    )}
                                </div>
                                <MedalCounts medals={reto.medals} />
                                <div className="mt-auto">
                                    <AcceptButton
                                        reto={reto}
                                        blocked={reto.blocked}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Terminadas ── */}
            {finished.length > 0 && (
                <section>
                    <SectionTitle
                        icon={Trophy}
                        subtitle="Las últimas que completaste. Todas tus medallas están en tu perfil."
                    >
                        Semanas terminadas
                    </SectionTitle>
                    <ul className="divide-y divide-border panel">
                        {finished.map((week) => (
                            <li
                                key={week.id}
                                className="flex items-center gap-3 p-4"
                            >
                                {week.medal ? (
                                    <MedalIcon medal={week.medal} size={28} />
                                ) : (
                                    <span className="h-7 w-7 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground">
                                        {week.title}
                                        {week.habilidad &&
                                            ` · ${week.habilidad}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Terminó el {shortDate(week.ends_on)} ·{' '}
                                        {week.days} de 7 días ·{' '}
                                        {week.medal
                                            ? `Medalla de ${MEDAL_STYLE[week.medal].label.toLowerCase()}`
                                            : 'No alcanzó para medalla'}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <CelebrationDialog items={celebrations} />
        </RetosLayout>
    );
}

/** Botón "Aceptar reto" (o el motivo por el que no se puede). */
function AcceptButton({
    reto,
    blocked,
}: {
    reto: RetoResumen;
    blocked: string | null;
}) {
    if (blocked) {
        return (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                {blocked}
            </p>
        );
    }

    return (
        <Button
            size="sm"
            onClick={() =>
                router.post(
                    `/retos/${reto.id}/semana`,
                    {},
                    { preserveScroll: true },
                )
            }
        >
            Aceptar reto de la semana
        </Button>
    );
}

function SkillCard({ skill }: { skill: HabilidadFrontera }) {
    return (
        <div className="flex flex-col gap-3 panel p-5">
            <div>
                <h3 className="flex items-center gap-3 font-serif text-lg font-semibold text-foreground">
                    <IconBadge icon={skillIcon(skill.icon)} />
                    {skill.name}
                </h3>
                {skill.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {skill.description}
                    </p>
                )}
            </div>
            {skill.reto && (
                <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-sm font-medium text-foreground">
                        {skill.reto.title} ·{' '}
                        <span className="font-normal text-muted-foreground">
                            {formatMinutes(skill.reto.minutes)} por día
                        </span>
                    </p>
                    {skill.reto.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {skill.reto.description}
                        </p>
                    )}
                    <MedalCounts medals={skill.reto.medals} className="mt-2" />
                </div>
            )}
            {skill.secret_unlocked ? (
                <Link
                    href={`/retos/arbol?arbol=${skill.tree}&habilidad=${skill.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                    <Sparkles className="h-4 w-4" />
                    ¡Reto secreto desbloqueado! Verlo en el árbol
                </Link>
            ) : (
                <SecretTeaser
                    valid={skill.valid_weeks}
                    needed={skill.secret_weeks}
                    compact
                />
            )}
            {skill.reto && (
                <div className="mt-auto">
                    <AcceptButton reto={skill.reto} blocked={skill.blocked} />
                </div>
            )}
        </div>
    );
}
