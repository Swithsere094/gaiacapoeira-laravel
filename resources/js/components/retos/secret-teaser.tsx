import { Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * El reto secreto antes de desbloquearse: una tarjeta misteriosa ("???",
 * texto borroso) y una barra por semana válida que se va llenando.
 */
export function SecretTeaser({
    valid,
    needed,
    compact = false,
}: {
    valid: number;
    needed: number;
    /** Versión chica para las tarjetas de "Mis retos". */
    compact?: boolean;
}) {
    const done = Math.min(valid, needed);

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-lg border border-dashed border-primary/40 bg-primary/5',
                compact ? 'p-3' : 'p-4',
            )}
        >
            <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary/70">
                    <Lock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                        <Sparkles className="h-3.5 w-3.5" />
                        Reto secreto
                    </p>
                    <p
                        aria-hidden="true"
                        className="font-serif text-lg font-bold tracking-widest text-foreground/70 blur-[3px] select-none"
                    >
                        ??? ????? ???
                    </p>
                </div>
            </div>

            <div className="mt-3 flex gap-1" aria-hidden="true">
                {Array.from({ length: needed }, (_, i) => (
                    <span
                        key={i}
                        className={cn(
                            'h-2 flex-1 rounded-full',
                            i < done ? 'bg-primary' : 'bg-secondary',
                        )}
                    />
                ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
                Se revela con {needed}{' '}
                {needed === 1 ? 'semana válida' : 'semanas válidas'} del reto de
                práctica · llevas {done}
            </p>
        </div>
    );
}
