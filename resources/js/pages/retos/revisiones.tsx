import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { FlashMessage } from '@/components/retos/flash-message';
import { RetosHeader } from '@/components/retos/retos-header';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { shortDate } from '@/lib/calendar';
import { TREE_LABELS } from '@/lib/retos';
import type { Tree } from '@/lib/retos';

interface Review {
    id: string;
    status: 'pendiente' | 'aprobada' | 'rechazada';
    comment: string | null;
    requested_on: string;
    reviewed_on: string | null;
    reviewer: string | null;
    user: { id: string; name: string; apodo: string | null };
    habilidad: { id: string; name: string; tree: Tree };
    /** Veces que completó el reto secreto. */
    sessions: number;
}

function who(r: Review): string {
    return r.user.apodo ? `${r.user.name} «${r.user.apodo}»` : r.user.name;
}

export default function RevisionesPage({
    pending,
    resolved,
    pending_reviews,
}: {
    pending: Review[];
    resolved: Review[];
    pending_reviews: number;
}) {
    const { confirm } = useConfirm();
    const { isAdmin } = useAuth();
    const [rejecting, setRejecting] = useState<Review | null>(null);

    const approve = async (r: Review) => {
        const ok = await confirm({
            title: `¿Aprobar «${r.habilidad.name}» para ${r.user.name}?`,
            description:
                'La habilidad queda dominada y se desbloquean las que dependen de ella.',
            confirmLabel: 'Aprobar',
        });

        if (ok) {
            router.post(
                `/retos/revisiones/${r.id}/aprobar`,
                {},
                { preserveScroll: true },
            );
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Head title="Revisiones" />
            <Navigation />

            <main className="pt-24 pb-16">
                <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <RetosHeader
                        title="Revisiones"
                        pendingReviews={pending_reviews}
                    >
                        Pedidos de revisión del reto secreto. Al aprobar, la
                        habilidad queda dominada; al rechazar, la persona ve tu
                        comentario y puede volver a pedirla.
                    </RetosHeader>

                    <FlashMessage />

                    <section className="space-y-3">
                        <h2 className="font-serif text-2xl font-bold text-foreground">
                            Pendientes
                        </h2>
                        {pending.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
                                No hay revisiones pendientes.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {pending.map((r) => (
                                    <li
                                        key={r.id}
                                        className="rounded-xl border border-border bg-card p-4"
                                    >
                                        <p className="text-xs font-medium tracking-wide text-primary uppercase">
                                            {TREE_LABELS[r.habilidad.tree]}
                                        </p>
                                        <p className="mt-1 font-serif text-lg font-semibold text-foreground">
                                            {r.habilidad.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {who(r)} · pedida el{' '}
                                            {shortDate(r.requested_on)} ·
                                            completó el reto secreto{' '}
                                            {r.sessions === 1
                                                ? '1 vez'
                                                : `${r.sessions} veces`}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                className="gap-1.5"
                                                onClick={() => void approve(r)}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Aprobar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                onClick={() => setRejecting(r)}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Rechazar
                                            </Button>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <Link
                                                    href={`/retos/personas/${r.user.id}?arbol=${r.habilidad.tree}`}
                                                >
                                                    Ver su árbol
                                                </Link>
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {resolved.length > 0 && (
                        <section className="space-y-3">
                            <h2 className="font-serif text-2xl font-bold text-foreground">
                                Respondidas
                            </h2>
                            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                                {resolved.map((r) => (
                                    <li key={r.id} className="flex gap-3 p-4">
                                        {r.status === 'aprobada' ? (
                                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                        ) : (
                                            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground">
                                                {r.habilidad.name} · {who(r)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {r.status === 'aprobada'
                                                    ? 'Aprobada'
                                                    : 'Rechazada'}
                                                {r.reviewer &&
                                                    ` por ${r.reviewer}`}
                                                {r.reviewed_on &&
                                                    ` el ${shortDate(r.reviewed_on)}`}
                                            </p>
                                            {r.comment && (
                                                <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                                                    «{r.comment}»
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {isAdmin && pending.length > 0 && (
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            Como admin, también puedes responder tus propios
                            pedidos.
                        </p>
                    )}
                </div>
            </main>

            <Footer />

            <RejectDialog
                key={rejecting?.id ?? 'ninguna'}
                review={rejecting}
                onClose={() => setRejecting(null)}
            />
        </div>
    );
}

/** Rechazar con un comentario obligatorio (qué le falta practicar). */
function RejectDialog({
    review,
    onClose,
}: {
    review: Review | null;
    onClose: () => void;
}) {
    const form = useForm({ comment: '' });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!review) {
            return;
        }

        form.post(`/retos/revisiones/${review.id}/rechazar`, {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Dialog
            open={review !== null}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent className="max-w-md">
                {review && (
                    <form onSubmit={submit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>
                                Rechazar «{review.habilidad.name}»
                            </DialogTitle>
                            <DialogDescription>
                                {review.user.name} va a ver tu comentario.
                                Escribe qué le falta practicar.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            value={form.data.comment}
                            onChange={(e) =>
                                form.setData('comment', e.target.value)
                            }
                            rows={4}
                            maxLength={1000}
                            placeholder="Ej.: la entrada al aú todavía se ve insegura; practica la subida contra la pared."
                            aria-label="Comentario"
                            aria-invalid={
                                form.errors.comment ? true : undefined
                            }
                        />
                        {form.errors.comment && (
                            <p className="text-sm text-destructive">
                                {form.errors.comment}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={form.processing}
                            >
                                Rechazar
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
