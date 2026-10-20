import { Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { RetosTabs } from '@/components/retos/retos-tabs';

/** Título de las páginas de retos, con la marca de demo y las pestañas. */
export function RetosHeader({
    title,
    children,
    pendingReviews,
}: {
    title: string;
    children?: ReactNode;
    pendingReviews: number;
}) {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="flex flex-wrap items-center gap-3 font-serif text-3xl font-bold text-foreground">
                    <Trophy className="h-8 w-8 text-primary" />
                    {title}
                    <span className="rounded-full border border-primary/50 px-2.5 py-0.5 font-sans text-xs font-medium tracking-wide text-primary uppercase">
                        Demo · solo admins
                    </span>
                </h1>
                {children && (
                    <div className="mt-2 max-w-2xl text-muted-foreground">
                        {children}
                    </div>
                )}
            </div>
            <RetosTabs pendingReviews={pendingReviews} />
        </div>
    );
}
