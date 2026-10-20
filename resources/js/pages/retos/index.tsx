import { Head, Link, router } from '@inertiajs/react';
import { Lock, Sparkles, Target, Trophy } from 'lucide-react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { ActiveWeekCard } from '@/components/retos/active-week-card';
import { DemoBar } from '@/components/retos/demo-bar';
import { FlashMessage } from '@/components/retos/flash-message';
import { MedalCounts, MedalIcon } from '@/components/retos/medals';
import { RetosHeader } from '@/components/retos/retos-header';
import { Button } from '@/components/ui/button';
import { shortDate } from '@/lib/calendar';
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
    frontier: HabilidadFrontera[];
    sueltos: RetoSuelto[];
    finished: SemanaTerminada[];
    pending_reviews: number;
    demo: RetosDemoState;
}

function SectionTitle({
    icon: Icon,
    title,
    subtitle,
}: {
    icon: typeof Target;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="mb-4">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
                <Icon className="h-6 w-6 text-primary" />
                {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
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
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
            <div>
                <h3 className="font-serif text-lg font-semibold text-foreground">
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
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Reto secreto:{' '}
                    {Math.min(skill.valid_weeks, skill.secret_weeks)} de{' '}
                    {skill.secret_weeks}{' '}
                    {skill.secret_weeks === 1
                        ? 'semana válida'
                        : 'semanas válidas'}
                </p>
            )}
            {skill.reto && (
                <div className="mt-auto">
                    <AcceptButton reto={skill.reto} blocked={skill.blocked} />
                </div>
            )}
        </div>
    );
}

export default function RetosPage({
    active,
    frontier,
    sueltos,
    finished,
    pending_reviews,
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
        <div className="min-h-screen bg-background">
            <Head title="Retos" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
                    <RetosHeader title="Retos" pendingReviews={pending_reviews}>
                        Acepta un reto y entrena durante 7 días. Con 4 días
                        ganas bronce, con 5 plata y con 6 o 7 oro.
                    </RetosHeader>

                    <DemoBar demo={demo} />
                    <FlashMessage />

                    {/* ── En curso ── */}
                    <section>
                        <SectionTitle
                            icon={Target}
                            title="En curso"
                            subtitle="Tus retos de esta semana"
                        />
                        {active.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                No tienes retos en curso. Elige uno de los de
                                abajo.
                            </p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {active.map((semana) => (
                                    <ActiveWeekCard
                                        key={semana.id}
                                        semana={semana}
                                        today={demo.today}
                                        onAbandon={(s) => void abandon(s)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* ── Del árbol ── */}
                    <section>
                        <SectionTitle
                            icon={Sparkles}
                            title="Para avanzar en el árbol"
                            subtitle="Las habilidades que tienes desbloqueadas. Puedes trabajar una o varias a la vez."
                        />
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
                                                No hay habilidades disponibles
                                                en este árbol.
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

                    {/* ── Sueltos ── */}
                    <section>
                        <SectionTitle
                            icon={Target}
                            title="Retos sueltos"
                            subtitle="No dependen del árbol: flexibilidad, fuerza, resistencia y más. También dan medallas."
                        />
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {sueltos.map((reto) => (
                                <div
                                    key={reto.id}
                                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
                                >
                                    <div>
                                        <p className="text-xs font-medium tracking-wide text-primary uppercase">
                                            {CATEGORY_LABELS[
                                                reto.category ?? ''
                                            ] ?? 'Reto suelto'}
                                        </p>
                                        <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                                            {reto.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {formatMinutes(reto.minutes)} por
                                            día
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

                    {/* ── Terminadas ── */}
                    {finished.length > 0 && (
                        <section>
                            <SectionTitle
                                icon={Trophy}
                                title="Semanas terminadas"
                                subtitle="Las últimas que completaste. Todas tus medallas están en tu perfil."
                            />
                            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                                {finished.map((week) => (
                                    <li
                                        key={week.id}
                                        className="flex items-center gap-3 p-4"
                                    >
                                        {week.medal ? (
                                            <MedalIcon
                                                medal={week.medal}
                                                className="h-7 w-7 shrink-0"
                                            />
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
                                                Terminó el{' '}
                                                {shortDate(week.ends_on)} ·{' '}
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
                </div>
            </main>

            <Footer />
        </div>
    );
}
