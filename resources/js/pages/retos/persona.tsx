import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { FlashMessage } from '@/components/retos/flash-message';
import { RetosHeader } from '@/components/retos/retos-header';
import {
    RequisitosList,
    StatusChip,
    dominatedText,
} from '@/components/retos/skill-dialog';
import { SkillTree, TreeLegend } from '@/components/retos/skill-tree';
import { TreeSwitch } from '@/components/retos/tree-switch';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ancestorsOf, descendantsOf } from '@/lib/arbol';
import type { TreeNode } from '@/lib/arbol';
import type { Tree } from '@/lib/retos';

interface Props {
    person: { id: string; name: string; apodo: string | null };
    tree: Tree;
    nodes: TreeNode[];
    pending_reviews: number;
}

/** Nombres de una lista de ids, separados por comas. */
function names(ids: string[], nodes: TreeNode[]): string {
    return ids
        .map((id) => nodes.find((n) => n.id === id)?.name)
        .filter(Boolean)
        .join(', ');
}

/**
 * Árbol de otra persona para marcar a mano lo que ya domina. Marcar marca
 * también los requisitos; quitar quita también lo que depende de ella.
 */
export default function PersonaPage({
    person,
    tree,
    nodes,
    pending_reviews,
}: Props) {
    const { confirm } = useConfirm();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const node = nodes.find((n) => n.id === selectedId) ?? null;
    const url = `/retos/personas/${person.id}`;
    const dominated = nodes.filter((n) => n.status === 'dominada').length;

    const mark = async (n: TreeNode) => {
        const extra = ancestorsOf(n.id, nodes).filter(
            (id) => nodes.find((x) => x.id === id)?.status !== 'dominada',
        );
        const ok = await confirm({
            title: `¿Marcar «${n.name}» como dominada?`,
            description: extra.length
                ? `También se marcan sus requisitos: ${names(extra, nodes)}.`
                : undefined,
            confirmLabel: 'Marcar',
        });

        if (ok) {
            router.post(
                `${url}/habilidades/${n.id}`,
                {},
                { preserveScroll: true },
            );
        }
    };

    const unmark = async (n: TreeNode) => {
        const extra = descendantsOf(n.id, nodes).filter(
            (id) => nodes.find((x) => x.id === id)?.status === 'dominada',
        );
        const ok = await confirm({
            title: `¿Quitar «${n.name}»?`,
            description: extra.length
                ? `También se quitan las que dependen de ella: ${names(extra, nodes)}.`
                : 'Vuelve a quedar sin dominar.',
            confirmLabel: 'Quitar',
            destructive: true,
        });

        if (ok) {
            router.delete(`${url}/habilidades/${n.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Árbol de ${person.name}`} />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <RetosHeader
                        title={`Árbol de ${person.name}`}
                        pendingReviews={pending_reviews}
                    >
                        Toca una habilidad para marcarla como dominada (por
                        ejemplo, si la persona ya la sabía al llegar al grupo) o
                        para quitarla.
                    </RetosHeader>

                    <Link
                        href="/retos/personas"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a personas
                    </Link>

                    <FlashMessage />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TreeSwitch tree={tree} baseUrl={url} />
                        <p className="text-sm text-muted-foreground">
                            Domina {dominated} de {nodes.length}
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

            <Dialog
                open={node !== null}
                onOpenChange={(open) => !open && setSelectedId(null)}
            >
                <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                    {node && (
                        <>
                            <DialogHeader>
                                <div>
                                    <StatusChip node={node} />
                                </div>
                                <DialogTitle className="font-serif text-2xl">
                                    {node.name}
                                </DialogTitle>
                                <DialogDescription>
                                    {person.apodo ?? person.name}
                                </DialogDescription>
                            </DialogHeader>

                            {node.dominated && (
                                <p className="flex items-center gap-2 text-sm text-primary">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    {dominatedText(node)}
                                </p>
                            )}

                            <div className="space-y-2">
                                <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                                    Requisitos
                                </p>
                                <RequisitosList node={node} nodes={nodes} />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {node.status === 'dominada' ? (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setSelectedId(null);
                                            void unmark(node);
                                        }}
                                    >
                                        Quitar
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setSelectedId(null);
                                            void mark(node);
                                        }}
                                    >
                                        Marcar como dominada
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
