import { Link } from '@inertiajs/react';
import { TREES } from '@/lib/arbol';
import { TREE_LABELS } from '@/lib/retos';
import type { Tree } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Selector de árbol: Movimiento / Musicalidad (`?arbol=`). */
export function TreeSwitch({ tree, baseUrl }: { tree: Tree; baseUrl: string }) {
    return (
        <div
            className="inline-flex rounded-lg bg-secondary p-1"
            role="group"
            aria-label="Árbol"
        >
            {TREES.map((t) => (
                <Link
                    key={t}
                    href={`${baseUrl}?arbol=${t}`}
                    preserveScroll
                    aria-current={t === tree ? 'page' : undefined}
                    className={cn(
                        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                        t === tree
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {TREE_LABELS[t]}
                </Link>
            ))}
        </div>
    );
}
