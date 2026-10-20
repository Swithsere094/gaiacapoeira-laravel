import { router } from '@inertiajs/react';
import {
    CalendarClock,
    FastForward,
    FlaskConical,
    RotateCcw,
} from 'lucide-react';
import { useConfirm } from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { longDate } from '@/lib/calendar';
import type { RetosDemoState } from '@/lib/retos';

/**
 * Controles de prueba del demo: simular días, cronómetro rápido y reiniciar
 * el progreso propio. Solo afectan a quien los usa.
 */
export function DemoBar({ demo }: { demo: RetosDemoState }) {
    const { confirm } = useConfirm();
    const post = (url: string) =>
        router.post(url, {}, { preserveScroll: true });

    const reset = async () => {
        const ok = await confirm({
            title: '¿Reiniciar tu progreso de retos?',
            description:
                'Se borran tus semanas, entrenamientos, habilidades dominadas y revisiones. Solo lo tuyo.',
            confirmLabel: 'Reiniciar',
            destructive: true,
        });

        if (ok) {
            post('/retos/demo/reiniciar');
        }
    };

    return (
        <div className="rounded-xl border border-dashed border-primary/50 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FlaskConical className="h-4 w-4" />
                    Controles de prueba
                </p>
                <p className="text-sm text-muted-foreground">
                    Hoy:{' '}
                    <span className="font-medium text-foreground">
                        {longDate(demo.today)}
                    </span>
                    {demo.offset > 0 &&
                        ` (simulado, +${demo.offset} ${demo.offset === 1 ? 'día' : 'días'})`}
                </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => post('/retos/demo/dia-siguiente')}
                >
                    <CalendarClock className="h-4 w-4" />
                    Pasar al día siguiente
                </Button>
                {demo.offset > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => post('/retos/demo/hoy')}
                    >
                        Volver a hoy
                    </Button>
                )}
                <Button
                    size="sm"
                    variant={demo.fast ? 'default' : 'outline'}
                    className="gap-1.5"
                    aria-pressed={demo.fast}
                    onClick={() => post('/retos/demo/rapido')}
                >
                    <FastForward className="h-4 w-4" />
                    Cronómetro rápido: {demo.fast ? 'sí' : 'no'}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => void reset()}
                >
                    <RotateCcw className="h-4 w-4" />
                    Reiniciar mi progreso
                </Button>
            </div>
        </div>
    );
}
