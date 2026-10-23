import { usePage } from '@inertiajs/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Resultado de la última acción (flash `success` / `error` de la sesión). */
export function FlashMessage({ className }: { className?: string }) {
    const { flash } = usePage().props;
    const message = flash.error ?? flash.success;

    if (!message) {
        return null;
    }

    const Icon = flash.error ? AlertCircle : CheckCircle2;

    return (
        <div
            role={flash.error ? 'alert' : 'status'}
            className={cn(
                'flex items-start gap-2 rounded-lg border p-3 text-sm',
                flash.error
                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                    : 'border-primary/50 bg-primary/10 text-foreground',
                className,
            )}
        >
            <Icon
                className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    !flash.error && 'text-primary',
                )}
            />
            {message}
        </div>
    );
}
