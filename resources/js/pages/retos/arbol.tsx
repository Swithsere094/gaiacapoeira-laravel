import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { DemoBar } from '@/components/retos/demo-bar';
import { FlashMessage } from '@/components/retos/flash-message';
import { RetosHeader } from '@/components/retos/retos-header';
import { SkillDialog } from '@/components/retos/skill-dialog';
import { SkillTree, TreeLegend } from '@/components/retos/skill-tree';
import { TreeSwitch } from '@/components/retos/tree-switch';
import type { TreeNode } from '@/lib/arbol';
import type { RetosDemoState, Tree } from '@/lib/retos';

interface Props {
    tree: Tree;
    nodes: TreeNode[];
    /** Habilidad a abrir al entrar (al volver de un reto secreto). */
    selected: string | null;
    pending_reviews: number;
    demo: RetosDemoState;
}

export default function ArbolPage({
    tree,
    nodes,
    selected,
    pending_reviews,
    demo,
}: Props) {
    const [selectedId, setSelectedId] = useState(selected);
    const node = nodes.find((n) => n.id === selectedId) ?? null;
    const dominated = nodes.filter((n) => n.status === 'dominada').length;

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

                    <DemoBar demo={demo} />
                    {!node && <FlashMessage />}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TreeSwitch tree={tree} baseUrl="/retos/arbol" />
                        <p className="text-sm text-muted-foreground">
                            Dominas {dominated} de {nodes.length}
                        </p>
                    </div>

                    <SkillTree
                        nodes={nodes}
                        selectedId={selectedId}
                        onSelect={(n) => setSelectedId(n.id)}
                    />
                    <TreeLegend />
                </div>
            </main>

            <Footer />

            <SkillDialog
                node={node}
                nodes={nodes}
                onClose={() => setSelectedId(null)}
            />
        </div>
    );
}
