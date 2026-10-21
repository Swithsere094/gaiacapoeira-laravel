import { ArrowDown } from 'lucide-react';
import { StatusIcon } from '@/components/retos/skill-tree';
import { unlocksOf } from '@/lib/arbol';
import type { TreeNode } from '@/lib/arbol';
import { cn } from '@/lib/utils';

/**
 * El entorno de una habilidad: lo que necesita (arriba), ella (al medio) y lo
 * que desbloquea (abajo). Tocar una de arriba o de abajo la abre, así se
 * recorre el árbol paso a paso (sobre todo en el celular, donde no se ve el
 * dibujo completo).
 */
export function SkillFocus({
    node,
    nodes,
    onSelect,
}: {
    node: TreeNode;
    nodes: TreeNode[];
    onSelect: (node: TreeNode) => void;
}) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const requisitos = node.requisitos
        .map((id) => byId.get(id))
        .filter((n) => n !== undefined);
    const unlocks = unlocksOf(node.id, nodes)
        .map((id) => byId.get(id))
        .filter((n) => n !== undefined);

    return (
        <div className="rounded-xl border border-border bg-background/40 p-3">
            <Row
                label="Necesita"
                empty="Nada: es una de las primeras del árbol."
                nodes={requisitos}
                onSelect={onSelect}
            />
            <Arrow />
            <div className="flex justify-center">
                <span className="flex items-center gap-2 rounded-xl border-2 border-primary bg-primary/10 px-3 py-2 font-medium text-foreground">
                    <StatusIcon node={node} className="h-7 w-7" />
                    {node.name}
                </span>
            </div>
            <Arrow />
            <Row
                label="Desbloquea"
                empty="Nada más: es de las últimas del árbol."
                nodes={unlocks}
                onSelect={onSelect}
            />
        </div>
    );
}

function Arrow() {
    return (
        <div className="flex justify-center py-1 text-primary/70">
            <ArrowDown className="h-4 w-4" />
        </div>
    );
}

function Row({
    label,
    empty,
    nodes,
    onSelect,
}: {
    label: string;
    empty: string;
    nodes: TreeNode[];
    onSelect: (node: TreeNode) => void;
}) {
    return (
        <div className="text-center">
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            {nodes.length === 0 ? (
                <p className="text-xs text-muted-foreground">{empty}</p>
            ) : (
                <div className="flex flex-wrap justify-center gap-2">
                    {nodes.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            onClick={() => onSelect(n)}
                            className={cn(
                                'flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors hover:bg-secondary',
                                n.status === 'bloqueada'
                                    ? 'border-border text-muted-foreground'
                                    : 'border-primary/60 text-foreground',
                            )}
                        >
                            <StatusIcon
                                node={n}
                                className="h-6 w-6 [&_svg]:h-3 [&_svg]:w-3"
                            />
                            {n.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
