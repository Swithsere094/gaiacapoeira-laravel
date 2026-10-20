import { Check, Clock, Lock, Play, Sparkles, Target } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { arrangeLevels } from '@/lib/arbol';
import type { TreeNode } from '@/lib/arbol';
import { cn } from '@/lib/utils';

interface Edge {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    /** El requisito ya está dominado: la línea va en dorado. */
    done: boolean;
}

/**
 * El árbol de habilidades por niveles (sin librerías): una fila por nivel y
 * líneas de cada requisito a la habilidad que desbloquea. Las líneas se
 * miden sobre lo ya dibujado y se recalculan si cambia el tamaño. En
 * pantallas chicas el árbol se desplaza de costado.
 */
export function SkillTree({
    nodes,
    selectedId,
    onSelect,
}: {
    nodes: TreeNode[];
    selectedId: string | null;
    onSelect: (node: TreeNode) => void;
}) {
    const rows = useMemo(() => arrangeLevels(nodes), [nodes]);
    const canvas = useRef<HTMLDivElement>(null);
    const buttons = useRef(new Map<string, HTMLButtonElement>());
    const [edges, setEdges] = useState<Edge[]>([]);
    const [size, setSize] = useState({ width: 0, height: 0 });

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
        <div className="overflow-x-auto rounded-xl border border-border bg-card/30 p-4 sm:p-8">
            <div ref={canvas} className="relative mx-auto w-max min-w-full">
                <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute top-0 left-0"
                    width={size.width}
                    height={size.height}
                >
                    {edges.map((e) => {
                        const dy = (e.y2 - e.y1) / 2;

                        return (
                            <path
                                key={e.id}
                                d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + dy}, ${e.x2} ${e.y2 - dy}, ${e.x2} ${e.y2}`}
                                fill="none"
                                strokeWidth={e.done ? 2.5 : 1.5}
                                className={
                                    e.done ? 'stroke-primary' : 'stroke-border'
                                }
                            />
                        );
                    })}
                </svg>

                <ol className="relative flex flex-col gap-10 sm:gap-14">
                    {rows.map((row, level) => (
                        <li
                            key={level}
                            className="flex justify-center gap-3 sm:gap-5"
                        >
                            {row.map((node) => (
                                <NodeButton
                                    key={node.id}
                                    node={node}
                                    selected={node.id === selectedId}
                                    onClick={() => onSelect(node)}
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
    onClick,
    buttonRef,
}: {
    node: TreeNode;
    selected: boolean;
    onClick: () => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
}) {
    const Icon =
        node.status === 'dominada'
            ? Check
            : node.status === 'bloqueada'
              ? Lock
              : node.in_progress
                ? Play
                : Target;
    const secretReady = node.secreto !== null && node.status !== 'dominada';
    const pending = node.review?.status === 'pendiente';

    return (
        // Fondo opaco detrás de la tarjeta: las líneas que pasan por detrás
        // (las que saltan niveles) no se ven a través de ella.
        <div className="flex rounded-xl bg-background">
            <button
                ref={buttonRef}
                type="button"
                onClick={onClick}
                aria-pressed={selected}
                className={cn(
                    'relative flex w-24 flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors sm:w-28',
                    node.status === 'dominada' &&
                        'border-primary bg-primary/15 hover:bg-primary/25',
                    node.status === 'disponible' &&
                        'border-primary/60 bg-card hover:bg-secondary',
                    node.status === 'bloqueada' &&
                        'border-border bg-background/60 text-muted-foreground hover:bg-secondary/50',
                    selected &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background',
                )}
            >
                <span
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border',
                        node.status === 'dominada' &&
                            'border-primary bg-primary text-primary-foreground',
                        node.status === 'disponible' &&
                            'border-primary text-primary',
                        node.status === 'bloqueada' && 'border-border',
                    )}
                >
                    <Icon className="h-4 w-4" />
                </span>
                <span
                    className={cn(
                        'text-xs leading-tight font-medium',
                        node.status !== 'bloqueada' && 'text-foreground',
                    )}
                >
                    {node.name}
                </span>
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
            </button>
        </div>
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
            label: 'Desbloqueada',
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
