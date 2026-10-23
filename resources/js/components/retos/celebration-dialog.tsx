import { Link } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { MedalBadge } from '@/components/retos/medals';
import { retoIcon } from '@/components/retos/reto-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Celebration, SkillRef } from '@/lib/celebraciones';
import { skillIcon } from '@/lib/icons';
import { MEDAL_STYLE, WEEK_DAYS } from '@/lib/retos';

const treeUrl = (s: SkillRef) =>
    `/retos/arbol?arbol=${s.tree}&habilidad=${s.id}`;

/**
 * Pantalla de celebración de los logros nuevos (medalla, reto secreto
 * revelado, revisión aprobada). Si hay varios, van uno detrás de otro.
 */
export function CelebrationDialog({
    items,
    onDone,
}: {
    items: Celebration[];
    /** Al cerrar la última (o la ventana). */
    onDone?: () => void;
}) {
    const [index, setIndex] = useState(0);
    const item = items[index];
    const last = index === items.length - 1;

    const go = (next: number) => {
        setIndex(next);
        if (next >= items.length) {
            onDone?.();
        }
    };

    return (
        <Dialog
            open={item !== undefined}
            onOpenChange={(open) => !open && go(items.length)}
        >
            <DialogContent className="max-w-sm overflow-hidden text-center">
                {item && (
                    <div
                        key={index}
                        className="flex flex-col items-center gap-4"
                    >
                        {item.type === 'medal' ? (
                            <MedalView item={item} />
                        ) : (
                            <ApprovedView item={item} />
                        )}

                        <div className="flex w-full items-center justify-between gap-3 pt-2">
                            <span className="text-xs text-muted-foreground">
                                {items.length > 1 &&
                                    `${index + 1} de ${items.length}`}
                            </span>
                            <Button onClick={() => go(index + 1)}>
                                {last ? '¡Vamos!' : 'Siguiente'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function MedalView({
    item,
}: {
    item: Extract<Celebration, { type: 'medal' }>;
}) {
    return (
        <>
            <div className="relative flex h-44 w-full items-center justify-center">
                <Rays />
                <span className="animate-medal-in">
                    <MedalBadge
                        medal={item.medal}
                        icon={retoIcon(item)}
                        size={112}
                        shine
                    />
                </span>
            </div>
            <div>
                <DialogTitle className="text-2xl">
                    ¡Medalla de {MEDAL_STYLE[item.medal].label.toLowerCase()}!
                </DialogTitle>
                <DialogDescription className="mt-1">
                    {item.title}
                    {item.habilidad && ` · ${item.habilidad.name}`}
                    <br />
                    Entrenaste {item.days} de {WEEK_DAYS} días.
                </DialogDescription>
            </div>

            {item.secret && item.habilidad && (
                <div
                    className="w-full animate-reveal rounded-xl border border-primary/60 bg-primary/10 p-4"
                    style={{ animationDelay: '1.2s' }}
                >
                    <p className="flex items-center justify-center gap-2 font-serif text-lg font-bold text-primary">
                        <Sparkles className="h-5 w-5" />
                        ¡Reto secreto desbloqueado!
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Ya puedes ver el reto secreto de {item.habilidad.name}.
                    </p>
                    <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="mt-3"
                    >
                        <Link href={treeUrl(item.habilidad)}>
                            Verlo en el árbol
                        </Link>
                    </Button>
                </div>
            )}
        </>
    );
}

function ApprovedView({
    item,
}: {
    item: Extract<Celebration, { type: 'approved' }>;
}) {
    const Icon = skillIcon(item.habilidad.icon);

    return (
        <>
            <div className="relative flex h-40 w-full items-center justify-center">
                <Rays />
                <span className="flex h-24 w-24 animate-pop glow-breathe items-center justify-center rounded-full border-4 border-primary bg-primary text-primary-foreground">
                    <Icon className="h-11 w-11" />
                </span>
            </div>
            <div>
                <DialogTitle className="text-2xl">
                    ¡Dominas {item.habilidad.name}!
                </DialogTitle>
                <DialogDescription className="mt-1">
                    Aprobaron tu revisión del reto secreto.
                </DialogDescription>
            </div>

            {item.unlocks.length > 0 && (
                <div className="w-full">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-primary uppercase">
                        Desbloqueaste
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {item.unlocks.map((s, i) => {
                            const UnlockIcon = skillIcon(s.icon);

                            return (
                                <span
                                    key={s.id}
                                    className="flex animate-pop items-center gap-1.5 rounded-full border border-primary/60 py-1 pr-3 pl-1 text-sm text-foreground"
                                    style={{
                                        animationDelay: `${0.6 + i * 0.15}s`,
                                    }}
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary text-primary">
                                        <UnlockIcon className="h-3 w-3" />
                                    </span>
                                    {s.name}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            <Button asChild size="sm" variant="outline">
                <Link href={treeUrl(item.habilidad)}>Ver en el árbol</Link>
            </Button>
        </>
    );
}

/** Rayos de luz girando detrás de lo que se celebra. */
function Rays() {
    return (
        <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -mt-36 -ml-36 h-72 w-72 animate-rays rounded-full opacity-25"
            style={{
                background:
                    'repeating-conic-gradient(var(--primary) 0deg 10deg, transparent 10deg 30deg)',
                maskImage:
                    'radial-gradient(circle, black 30%, transparent 70%)',
            }}
        />
    );
}
