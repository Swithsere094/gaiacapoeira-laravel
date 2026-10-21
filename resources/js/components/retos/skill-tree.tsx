import {
    Check,
    ChevronRight,
    Clock,
    Lock,
    Play,
    Sparkles,
    Target,
} from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { arrangeLevels, unlocksOf } from '@/lib/arbol';
import type { TreeNode } from '@/lib/arbol';
import { skillIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface Edge {
    id: string;
    from: string;
    to: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    /** El requisito ya está dominado: la línea va en dorado. */
    done: boolean;
}

interface TreeProps {
    nodes: TreeNode[];
    selectedId: string | null;
    onSelect: (node: TreeNode) => void;
    /** Habilidades recién dominadas: sus líneas doradas se "dibujan". */
    drawFrom?: string[];
}

/**
 * El árbol de habilidades. En la computadora, el dibujo completo por niveles
 * (`TreeCanvas`); en el celular, donde ese dibujo no entra, una lista por
 * niveles (`SkillList`) con los requisitos como etiquetas. El detalle de cada
 * habilidad muestra su entorno (necesita → esta → desbloquea).
 */
export function SkillTree(props: TreeProps) {
    return (
        <>
            <div className="hidden md:block">
                <TreeCanvas {...props} />
            </div>
            <div className="md:hidden">
                <SkillList {...props} />
            </div>
        </>
    );
}

/** Ícono según el estado: ✓ dominada, 🔒 bloqueada y, desbloqueada, el suyo. */
export function nodeIcon(node: TreeNode) {
    if (node.status === 'dominada') {
        return Check;
    }

    if (node.status === 'bloqueada') {
        return Lock;
    }

    return skillIcon(node.icon);
}

/** El círculo con el ícono del estado (y ▶ si tiene un reto en curso). */
export function StatusIcon({
    node,
    className,
}: {
    node: TreeNode;
    className?: string;
}) {
    const Icon = nodeIcon(node);

    return (
        <span
            className={cn(
                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                node.status === 'dominada' &&
                    'border-primary bg-primary text-primary-foreground',
                node.status === 'disponible' && 'border-primary text-primary',
                node.status === 'bloqueada' &&
                    'border-border text-muted-foreground',
                className,
            )}
        >
            <Icon className="h-4 w-4" />
            {node.status === 'disponible' && node.in_progress && (
                <span
                    className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground [&_svg]:!h-2.5 [&_svg]:!w-2.5"
                    title="Reto en curso"
                >
                    <Play />
                </span>
            )}
        </span>
    );
}

/**
 * Dibujo completo por niveles (sin librerías): una fila por nivel y líneas de
 * cada requisito a la habilidad que desbloquea, medidas sobre lo ya dibujado
 * y recalculadas si cambia el tamaño. Al pasar el mouse (o el foco del
 * teclado) por una habilidad se resaltan sus requisitos, ella y lo que
 * desbloquea; el resto se atenúa.
 */
function TreeCanvas({ nodes, selectedId, onSelect, drawFrom = [] }: TreeProps) {
    const rows = useMemo(() => arrangeLevels(nodes), [nodes]);
    const canvas = useRef<HTMLDivElement>(null);
    const buttons = useRef(new Map<string, HTMLButtonElement>());
    const [edges, setEdges] = useState<Edge[]>([]);
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Lo conectado a la habilidad resaltada: ella, sus requisitos y lo que
    // desbloquea (solo un paso hacia cada lado).
    const related = useMemo(() => {
        const hovered = nodes.find((n) => n.id === hoveredId);

        return hovered
            ? new Set([
                  hovered.id,
                  ...hovered.requisitos,
                  ...unlocksOf(hovered.id, nodes),
              ])
            : null;
    }, [hoveredId, nodes]);

    useLayoutEffect(() => {
        const el = canvas.current;

        if (!el) {
            return;
        }

        const measure = () => {
            const box = el.getBoundingClientRect();
            const status = new Map(nodes.map((n) => [n.id, n.status]));
            const next: Edge[] = [];

            for (const node of nodes) {
                const to = buttons.current
                    .get(node.id)
                    ?.getBoundingClientRect();

                for (const id of node.requisitos) {
                    const from = buttons.current
                        .get(id)
                        ?.getBoundingClientRect();

                    if (to && from) {
                        next.push({
                            id: `${id}-${node.id}`,
                            from: id,
                            to: node.id,
                            x1: from.left + from.width / 2 - box.left,
                            y1: from.bottom - box.top,
                            x2: to.left + to.width / 2 - box.left,
                            y2: to.top - box.top,
                            done: status.get(id) === 'dominada',
                        });
                    }
                }
            }

            setEdges(next);
            setSize({ width: el.scrollWidth, height: el.scrollHeight });
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, [nodes]);

    return (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/30 p-8">
            <div
                ref={canvas}
                className="relative mx-auto w-max min-w-full"
                onMouseLeave={() => setHoveredId(null)}
            >
                <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0"
                    width={size.width}
                    height={size.height}
                >
                    {edges.map((e) => {
                        const dy = (e.y2 - e.y1) / 2;
                        const lit =
                            hoveredId !== null &&
                            (e.from === hoveredId || e.to === hoveredId);
                        const dim = hoveredId !== null && !lit;
                        const draw = e.done && drawFrom.includes(e.from);

                        return (
                            <path
                                key={e.id}
                                pathLength={draw ? 1 : undefined}
                                d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + dy}, ${e.x2} ${e.y2 - dy}, ${e.x2} ${e.y2}`}
                                fill="none"
                                strokeWidth={lit ? 3 : e.done ? 2.5 : 1.5}
                                className={cn(
                                    'transition-opacity duration-150',
                                    lit || e.done
                                        ? 'stroke-primary'
                                        : 'stroke-border',
                                    dim && 'opacity-15',
                                    draw && 'animate-draw',
                                )}
                            />
                        );
                    })}
                </svg>

                <ol className="relative flex flex-col gap-14">
                    {rows.map((row, level) => (
                        <li key={level} className="flex justify-center gap-5">
                            {row.map((node) => (
                                <NodeButton
                                    key={node.id}
                                    node={node}
                                    selected={node.id === selectedId}
                                    highlighted={node.id === hoveredId}
                                    dimmed={
                                        related !== null &&
                                        !related.has(node.id)
                                    }
                                    onClick={() => onSelect(node)}
                                    onHover={(on) =>
                                        setHoveredId(on ? node.id : null)
                                    }
                                    buttonRef={(el) => {
                                        if (el) {
                                            buttons.current.set(node.id, el);
                                        } else {
                                            buttons.current.delete(node.id);
                                        }
                                    }}
                                />
                            ))}
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

function NodeButton({
    node,
    selected,
    highlighted,
    dimmed,
    onClick,
    onHover,
    buttonRef,
}: {
    node: TreeNode;
    selected: boolean;
    highlighted: boolean;
    dimmed: boolean;
    onClick: () => void;
    onHover: (on: boolean) => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
}) {
    return (
        // Fondo opaco detrás de la tarjeta: las líneas que pasan por detrás
        // (las que saltan niveles) no se ven a través de ella, tampoco cuando
        // la tarjeta se atenúa.
        <div className="flex rounded-xl bg-background">
            <button
                ref={buttonRef}
                type="button"
                onClick={onClick}
                onMouseEnter={() => onHover(true)}
                onFocus={() => onHover(true)}
                onBlur={() => onHover(false)}
                aria-pressed={selected}
                className={cn(
                    'relative flex w-28 flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition',
                    node.status === 'dominada' &&
                        'border-primary bg-primary/15 hover:bg-primary/25',
                    node.status === 'disponible' &&
                        'border-primary/60 bg-card hover:bg-secondary',
                    node.status === 'bloqueada' &&
                        'border-border bg-background/60 text-muted-foreground hover:bg-secondary/50',
                    // Lo que se puede trabajar ahora "respira" (brillo suave).
                    node.status === 'disponible' &&
                        !highlighted &&
                        !dimmed &&
                        'glow-breathe',
                    highlighted && 'scale-105 border-primary shadow-lg',
                    dimmed && 'opacity-35',
                    selected &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background',
                )}
            >
                <StatusIcon node={node} />
                <span
                    className={cn(
                        'text-xs leading-tight font-medium',
                        node.status !== 'bloqueada' && 'text-foreground',
                    )}
                >
                    {node.name}
                </span>
                <NodeBadges node={node} />
            </button>
        </div>
    );
}

/** Marcas de la esquina: ✨ reto secreto disponible, 🕒 revisión pendiente. */
function NodeBadges({ node }: { node: TreeNode }) {
    const secretReady = node.secreto !== null && node.status !== 'dominada';
    const pending = node.review?.status === 'pendiente';

    return (
        <>
            {secretReady && (
                <span
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                    title="Reto secreto desbloqueado"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                </span>
            )}
            {pending && (
                <span
                    className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border border-primary bg-background text-primary shadow"
                    title="Revisión pendiente"
                >
                    <Clock className="h-3.5 w-3.5" />
                </span>
            )}
        </>
    );
}

/**
 * Celular: el árbol como lista por niveles. Cada habilidad muestra su estado
 * y lo que necesita (✓ ya dominado, 🔒 todavía no); al tocarla se abre su
 * detalle con el entorno.
 */
function SkillList({ nodes, selectedId, onSelect }: TreeProps) {
    const rows = useMemo(() => arrangeLevels(nodes), [nodes]);
    const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

    return (
        <ol className="space-y-5">
            {rows.map((row, level) => (
                <li key={level}>
                    <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
                        Nivel {level + 1}
                        <span className="h-px flex-1 bg-border" />
                    </p>
                    <ul className="space-y-2">
                        {row.map((node) => (
                            <li key={node.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelect(node)}
                                    aria-pressed={node.id === selectedId}
                                    className={cn(
                                        'relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                                        node.status === 'dominada' &&
                                            'border-primary bg-primary/15',
                                        node.status === 'disponible' &&
                                            'glow-breathe border-primary/60 bg-card',
                                        node.status === 'bloqueada' &&
                                            'border-border bg-background text-muted-foreground',
                                    )}
                                >
                                    <StatusIcon node={node} />
                                    <span className="min-w-0 flex-1">
                                        <span
                                            className={cn(
                                                'block font-medium',
                                                node.status !== 'bloqueada' &&
                                                    'text-foreground',
                                            )}
                                        >
                                            {node.name}
                                        </span>
                                        {node.requisitos.length > 0 && (
                                            <span className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                                                <span className="text-muted-foreground">
                                                    Necesita:
                                                </span>
                                                {node.requisitos.map((id) => {
                                                    const r = byId.get(id);
                                                    const done =
                                                        r?.status ===
                                                        'dominada';

                                                    return (
                                                        <span
                                                            key={id}
                                                            className={cn(
                                                                'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-px',
                                                                done
                                                                    ? 'border-primary/60 text-foreground'
                                                                    : 'border-border text-muted-foreground',
                                                            )}
                                                        >
                                                            {done ? (
                                                                <Check className="h-3 w-3 text-primary" />
                                                            ) : (
                                                                <Lock className="h-3 w-3" />
                                                            )}
                                                            {r?.name}
                                                        </span>
                                                    );
                                                })}
                                            </span>
                                        )}
                                    </span>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <NodeBadges node={node} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ol>
    );
}

/** Qué significa cada marca del árbol. */
export function TreeLegend() {
    const items = [
        {
            icon: Check,
            label: 'Dominada',
            className: 'bg-primary text-primary-foreground border-primary',
        },
        {
            icon: Target,
            label: 'Desbloqueada (con su ícono)',
            className: 'border-primary text-primary',
        },
        {
            icon: Play,
            label: 'Reto en curso',
            className: 'border-primary text-primary',
        },
        {
            icon: Lock,
            label: 'Bloqueada',
            className: 'border-border text-muted-foreground',
        },
        {
            icon: Sparkles,
            label: 'Reto secreto disponible',
            className: 'bg-primary text-primary-foreground border-primary',
        },
        {
            icon: Clock,
            label: 'Revisión pendiente',
            className: 'border-primary text-primary',
        },
    ];

    return (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {items.map(({ icon: Icon, label, className }) => (
                <li key={label} className="flex items-center gap-1.5">
                    <span
                        className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border',
                            className,
                        )}
                    >
                        <Icon className="h-3 w-3" />
                    </span>
                    {label}
                </li>
            ))}
        </ul>
    );
}
