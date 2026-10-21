/**
 * Logros por celebrar (los arma App\Support\Celebraciones). Llegan una sola
 * vez: el servidor los marca como celebrados al mandarlos.
 */
import type { Medal, Tree } from '@/lib/retos';

export interface SkillRef {
    id: string;
    name: string;
    icon: string | null;
    tree: Tree;
}

export type Celebration =
    | {
          type: 'medal';
          medal: Medal;
          title: string;
          days: number;
          category: string | null;
          habilidad: SkillRef | null;
          /** Esta semana completó las que pide el reto secreto: se revela. */
          secret: boolean;
      }
    | {
          type: 'approved';
          habilidad: SkillRef;
          /** Lo que se desbloqueó al dominarla. */
          unlocks: SkillRef[];
      };

/** Avance por árbol: habilidades dominadas sobre el total. */
export type TreeProgress = Record<Tree, { done: number; total: number }>;
