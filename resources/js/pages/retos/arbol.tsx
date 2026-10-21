import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { CelebrationDialog } from '@/components/retos/celebration-dialog';
import { DemoBar } from '@/components/retos/demo-bar';
import { FlashMessage } from '@/components/retos/flash-message';
import { TreeProgressRings } from '@/components/retos/progress-ring';
import { RetosHeader } from '@/components/retos/retos-header';
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
        <div className="min-h-screen bg-background">
            <Head title="Árbol de habilidades" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <RetosHeader
                        title="Árbol de habilidades"
                        pendingReviews={pending_reviews}
                    >
                        Cada habilidad se desbloquea al dominar las que la
                        preceden. Toca una para ver su reto, su reto secreto y
                        pedir la revisión.
                    </RetosHeader>

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
                </div>
            </main>

            <Footer />

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
        </div>
    );
}
