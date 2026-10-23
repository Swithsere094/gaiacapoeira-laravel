import { useState } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { CelebrationDialog } from '@/components/retos/celebration-dialog';
import { DemoBar } from '@/components/retos/demo-bar';
import { TreeProgressRings } from '@/components/retos/progress-ring';
import { RetosLayout } from '@/components/retos/retos-layout';
import { SkillDialog } from '@/components/retos/skill-dialog';
import { SkillTree, TreeLegend } from '@/components/retos/skill-tree';
import { TreeSwitch } from '@/components/retos/tree-switch';
import type { TreeNode } from '@/lib/arbol';
import type { Celebration, TreeProgress } from '@/lib/celebraciones';
import type { RetosDemoState, Tree } from '@/lib/retos';

interface Props {
    tree: Tree;
    nodes: TreeNode[];
    /** Habilidad a abrir al entrar (al volver de un reto secreto). */
    selected: string | null;
    pending_reviews: number;
    progress: TreeProgress;
    celebrations: Celebration[];
    /** Controles de prueba (null si no es admin). */
    demo: RetosDemoState | null;
}

export default function ArbolPage({
    tree,
    nodes,
    selected,
    pending_reviews,
    progress,
    celebrations,
    demo,
}: Props) {
    const [selectedId, setSelectedId] = useState(selected);
    const node = nodes.find((n) => n.id === selectedId) ?? null;
    // Recién dominadas (revisión aprobada): sus líneas se "dibujan" al
    // cerrar la celebración (antes quedarían tapadas por ella).
    const [celebrated, setCelebrated] = useState(celebrations.length === 0);
    const drawFrom = celebrated
        ? celebrations.flatMap((c) =>
              c.type === 'approved' ? [c.habilidad.id] : [],
          )
        : [];

    return (
        <RetosLayout
            title="Árbol de habilidades"
            width="wide"
            pendingReviews={pending_reviews}
            className="space-y-6"
            description={
                <>
                    Cada habilidad se desbloquea al dominar las que la preceden.
                    Toca una para ver su reto, su reto secreto y pedir la
                    revisión.
                </>
            }
        >
            <TreeProgressRings progress={progress} linked={false} />

            {demo && <DemoBar demo={demo} />}
            {!node && <FlashMessage />}

            <TreeSwitch tree={tree} baseUrl="/retos/arbol" />

            <SkillTree
                nodes={nodes}
                selectedId={selectedId}
                onSelect={(n) => setSelectedId(n.id)}
                drawFrom={drawFrom}
            />
            <TreeLegend />

            <CelebrationDialog
                items={celebrations}
                onDone={() => setCelebrated(true)}
            />

            <SkillDialog
                node={node}
                nodes={nodes}
                onSelect={(n) => setSelectedId(n.id)}
                onClose={() => setSelectedId(null)}
            />
        </RetosLayout>
    );
}
