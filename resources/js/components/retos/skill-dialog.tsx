import { Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock,
    Lock,
    MessageSquareWarning,
    Play,
    Sparkles,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { FlashMessage } from '@/components/flash-message';
import { MedalCounts } from '@/components/retos/medals';
import { SecretTeaser } from '@/components/retos/secret-teaser';
import { SkillFocus } from '@/components/retos/skill-focus';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { STATUS_LABELS } from '@/lib/arbol';
import type { TreeNode } from '@/lib/arbol';
import { shortDate } from '@/lib/calendar';
import { formatMinutes } from '@/lib/retos';
import { cn } from '@/lib/utils';

/** Chip con el estado de la habilidad. */
export function StatusChip({ node }: { node: TreeNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                node.status === 'dominada' &&
                    'border-primary bg-primary text-primary-foreground',
                node.status === 'disponible' && 'border-primary text-primary',
                node.status === 'bloqueada' &&
                    'border-border text-muted-foreground',
            )}
        >
            {node.status === 'bloqueada' && <Lock className="h-3 w-3" />}
            {node.status === 'dominada' && <CheckCircle2 className="h-3 w-3" />}
            {STATUS_LABELS[node.status]}
        </span>
    );
}

/** Cómo quedó dominada: "Por revisión de Ana, el 3 de nov." */
export function dominatedText(node: TreeNode): string | null {
    if (!node.dominated) {
        return null;
    }

    const how =
        node.dominated.source === 'revision'
            ? 'Aprobada en revisión'
            : 'Marcada a mano';
    const by = node.dominated.by ? ` por ${node.dominated.by}` : '';

    return `${how}${by}, el ${shortDate(node.dominated.on)}.`;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="space-y-2 border-t border-border pt-4">
            <h3 className="text-xs font-semibold tracking-wide text-primary uppercase">
                {title}
            </h3>
            {children}
        </section>
    );
}

/**
 * Detalle de una habilidad del árbol propio: su entorno (necesita → esta →
 * desbloquea, para recorrer el árbol desde acá), reto de práctica, avance
 * hacia el reto secreto, el secreto y la revisión.
 */
export function SkillDialog({
    node,
    nodes,
    onSelect,
    onClose,
}: {
    node: TreeNode | null;
    nodes: TreeNode[];
    onSelect: (node: TreeNode) => void;
    onClose: () => void;
}) {
    const post = (url: string) =>
        router.post(url, {}, { preserveScroll: true });

    return (
        <Dialog
            open={node !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
                {node && (
                    <>
                        <DialogHeader>
                            <div>
                                <StatusChip node={node} />
                            </div>
                            <DialogTitle>{node.name}</DialogTitle>
                            {node.description && (
                                <DialogDescription>
                                    {node.description}
                                </DialogDescription>
                            )}
                        </DialogHeader>

                        <FlashMessage />

                        {node.dominated && (
                            <p className="flex items-center gap-2 text-sm text-primary">
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {dominatedText(node)}
                            </p>
                        )}

                        <Section title="En el árbol">
                            <SkillFocus
                                node={node}
                                nodes={nodes}
                                onSelect={onSelect}
                            />
                            {node.status === 'bloqueada' && (
                                <p className="text-sm text-muted-foreground">
                                    Domina todos sus requisitos para
                                    desbloquearla.
                                </p>
                            )}
                        </Section>

                        {node.practica && node.status !== 'bloqueada' && (
                            <Section title="Reto de práctica">
                                <p className="text-sm font-medium text-foreground">
                                    {node.practica.title} ·{' '}
                                    <span className="font-normal text-muted-foreground">
                                        {formatMinutes(node.practica.minutes)}{' '}
                                        por día, 7 días
                                    </span>
                                </p>
                                {node.practica.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {node.practica.description}
                                    </p>
                                )}
                                <MedalCounts medals={node.practica.medals} />
                                <div className="pt-1">
                                    {node.in_progress ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            className="gap-1.5"
                                        >
                                            <Link
                                                href={`/retos/${node.practica.id}/entrenar`}
                                            >
                                                <Play className="h-4 w-4" />
                                                Entrenar (semana en curso)
                                            </Link>
                                        </Button>
                                    ) : node.practica.blocked ? (
                                        <p className="text-sm text-muted-foreground">
                                            {node.practica.blocked}
                                        </p>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                post(
                                                    `/retos/${node.practica!.id}/semana`,
                                                )
                                            }
                                        >
                                            Aceptar reto de la semana
                                        </Button>
                                    )}
                                </div>
                            </Section>
                        )}

                        {node.status !== 'bloqueada' && (
                            <Section title="Reto secreto">
                                {node.secreto ? (
                                    <SecretPanel node={node} post={post} />
                                ) : (
                                    <SecretTeaser
                                        valid={node.valid_weeks}
                                        needed={node.secret_weeks}
                                    />
                                )}
                            </Section>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function SecretPanel({
    node,
    post,
}: {
    node: TreeNode;
    post: (url: string) => void;
}) {
    const secreto = node.secreto!;
    const review = node.review;

    return (
        <div className="space-y-3">
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {secreto.title}
                </p>
                {secreto.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                        {secreto.description}
                    </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    {formatMinutes(secreto.minutes)} ·{' '}
                    {secreto.sessions === 0
                        ? 'Todavía no lo completaste'
                        : secreto.sessions === 1
                          ? 'Lo completaste 1 vez'
                          : `Lo completaste ${secreto.sessions} veces`}
                </p>
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="mt-3 gap-1.5"
                >
                    <Link href={`/retos/${secreto.id}/entrenar`}>
                        <Play className="h-4 w-4" />
                        Entrenar reto secreto
                    </Link>
                </Button>
            </div>

            {node.status !== 'dominada' && (
                <>
                    {review?.status === 'pendiente' && (
                        <p className="flex items-center gap-2 text-sm text-primary">
                            <Clock className="h-4 w-4 shrink-0" />
                            Pediste la revisión el{' '}
                            {shortDate(review.requested_on)}: está pendiente.
                        </p>
                    )}
                    {review?.status === 'rechazada' && (
                        <div className="rounded-lg border border-border p-3 text-sm">
                            <p className="flex items-center gap-2 font-medium text-foreground">
                                <MessageSquareWarning className="h-4 w-4 text-primary" />
                                Revisión rechazada
                                {review.reviewer && ` por ${review.reviewer}`}
                            </p>
                            {review.comment && (
                                <p className="mt-1 whitespace-pre-line text-muted-foreground">
                                    {review.comment}
                                </p>
                            )}
                        </div>
                    )}
                    {review?.status !== 'pendiente' && (
                        <div className="space-y-1.5">
                            <Button
                                size="sm"
                                disabled={node.review_blocked !== null}
                                onClick={() =>
                                    post(
                                        `/retos/habilidades/${node.id}/revision`,
                                    )
                                }
                            >
                                {review?.status === 'rechazada'
                                    ? 'Pedir revisión otra vez'
                                    : 'Pedir revisión'}
                            </Button>
                            <p className="text-xs text-muted-foreground">
                                {node.review_blocked ??
                                    'Cuando sientas que lo dominas, pide la revisión: si la aprueban, se desbloquea lo que sigue.'}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
