/**
 * Árbol de habilidades (demo de retos): tipos (los arma App\Support\ArbolView)
 * y utilidades para dibujarlo.
 */
import type { RetoResumen, Tree } from '@/lib/retos';

export type NodeStatus = 'dominada' | 'disponible' | 'bloqueada';

export interface TreeNode {
    id: string;
    name: string;
    description: string | null;
    video_url: string | null;
    /** 0 = raíz; cada habilidad va un nivel debajo de su requisito más profundo. */
    level: number;
    /** Ids de las habilidades que hay que dominar (todas) para desbloquearla. */
    requisitos: string[];
    status: NodeStatus;
    /** Tiene una semana de práctica en curso. */
    in_progress: boolean;
    valid_weeks: number;
    secret_weeks: number;
    practica: (RetoResumen & { blocked: string | null }) | null;
    /** Solo llega si el reto secreto ya está desbloqueado. */
    secreto: {
        id: string;
        title: string;
        description: string | null;
        minutes: number;
        /** Entrenamientos completados del reto secreto. */
        sessions: number;
    } | null;
    /** La última revisión pedida. */
    review: {
        status: 'pendiente' | 'aprobada' | 'rechazada';
        comment: string | null;
        requested_on: string;
        reviewer: string | null;
    } | null;
    /** Por qué no puede pedir revisión (null = puede, o no aplica). */
    review_blocked: string | null;
    dominated: {
        source: 'revision' | 'manual';
        by: string | null;
        on: string;
    } | null;
}

export const STATUS_LABELS: Record<NodeStatus, string> = {
    dominada: 'Dominada',
    disponible: 'Desbloqueada',
    bloqueada: 'Bloqueada',
};

export const TREES: Tree[] = ['movimiento', 'musicalidad'];

/**
 * Habilidades por nivel, ordenadas para que se crucen pocas líneas: cada una
 * se ubica cerca del promedio de la posición de sus requisitos.
 */
export function arrangeLevels(nodes: TreeNode[]): TreeNode[][] {
    const rows: TreeNode[][] = [];
    for (const node of nodes) {
        (rows[node.level] ??= []).push(node);
    }

    const position = new Map<string, number>();

    return rows
        .filter((row) => row !== undefined)
        .map((row, level) => {
            const sorted =
                level === 0
                    ? row
                    : row
                          .map((node, i) => {
                              const known = node.requisitos
                                  .map((id) => position.get(id))
                                  .filter((p) => p !== undefined);
                              const avg = known.length
                                  ? known.reduce((a, b) => a + b, 0) /
                                    known.length
                                  : i;

                              return { node, key: avg, i };
                          })
                          .sort((a, b) => a.key - b.key || a.i - b.i)
                          .map((x) => x.node);

            // Posición relativa (0 a 1) para el nivel siguiente.
            sorted.forEach((node, i) =>
                position.set(node.id, (i + 0.5) / sorted.length),
            );

            return sorted;
        });
}

/** Requisitos directos e indirectos de una habilidad. */
export function ancestorsOf(id: string, nodes: TreeNode[]): string[] {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const found = new Set<string>();
    const pending = [id];

    while (pending.length) {
        for (const r of byId.get(pending.pop()!)?.requisitos ?? []) {
            if (!found.has(r)) {
                found.add(r);
                pending.push(r);
            }
        }
    }

    return [...found];
}

/** Habilidades que dependen (directa o indirectamente) de esta. */
export function descendantsOf(id: string, nodes: TreeNode[]): string[] {
    return nodes
        .filter((n) => ancestorsOf(n.id, nodes).includes(id))
        .map((n) => n.id);
}
