import { Link } from '@inertiajs/react';
import type { TreeProgress } from '@/lib/celebraciones';
import { TREE_LABELS } from '@/lib/retos';
import type { Tree } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Anillo que se llena según `value` (0 a 1), con texto al centro. */
export function ProgressRing({
    value,
    size = 64,
    stroke = 6,
    children,
    className,
}: {
    value: number;
    size?: number;
    stroke?: number;
    children?: React.ReactNode;
    className?: string;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.min(1, Math.max(0, value));

    return (
        <span
            className={cn('relative inline-flex shrink-0', className)}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-secondary"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - v)}
                    className="stroke-primary transition-[stroke-dashoffset] duration-700"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
                {children}
            </span>
        </span>
    );
}

/** Avance de los dos árboles ("Movimiento 4/20 · Musicalidad 1/16"). */
export function TreeProgressRings({
    progress,
    linked = true,
    className,
}: {
    progress: TreeProgress;
    /** Cada anillo lleva a su árbol. */
    linked?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'grid grid-cols-2 gap-3 sm:flex sm:flex-wrap',
                className,
            )}
        >
            {(Object.keys(progress) as Tree[]).map((tree) => {
                const { done, total } = progress[tree];
                const body = (
                    <>
                        <ProgressRing
                            value={total ? done / total : 0}
                            size={52}
                        >
                            <span className="text-xs font-semibold text-foreground">
                                {total ? Math.round((done / total) * 100) : 0}%
                            </span>
                        </ProgressRing>
                        <span>
                            <span className="block text-sm font-semibold text-foreground">
                                {TREE_LABELS[tree]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {done} de {total} dominadas
                            </span>
                        </span>
                    </>
                );
                const cls =
                    'flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2 sm:gap-3 sm:px-3';

                return linked ? (
                    <Link
                        key={tree}
                        href={`/retos/arbol?arbol=${tree}`}
                        className={cn(
                            cls,
                            'transition-colors hover:border-primary/60',
                        )}
                    >
                        {body}
                    </Link>
                ) : (
                    <div key={tree} className={cls}>
                        {body}
                    </div>
                );
            })}
        </div>
    );
}
