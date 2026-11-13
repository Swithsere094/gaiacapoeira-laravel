import { Music } from 'lucide-react';
import { estadoDe, ESTADOS, tipoLabel } from '@/lib/portugues';
import { cn } from '@/lib/utils';
import type { EstadoPalabra, Palabra, Tarjeta } from '@/types/portugues';

const ESTADO_CLASES: Record<EstadoPalabra, string> = {
    sin_trabajar: 'border-border text-muted-foreground',
    con_asociacion: 'border-primary/50 text-primary',
    aprendida: 'border-primary bg-primary text-primary-foreground',
};

/** Etiqueta del estado de una palabra (sin trabajar, con asociación, aprendida). */
export function EstadoBadge({
    tarjeta,
    className,
}: {
    tarjeta: Tarjeta | undefined;
    className?: string;
}) {
    const estado = estadoDe(tarjeta);

    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                ESTADO_CLASES[estado],
                className,
            )}
        >
            {ESTADOS.find((e) => e.value === estado)?.label}
        </span>
    );
}

/** "Sale en N canciones" del cancionero. */
export function CancionesBadge({ canciones }: { canciones: number }) {
    if (canciones === 0) {
        return null;
    }

    return (
        <span
            className="inline-flex items-center gap-1 text-xs text-muted-foreground"
            title="Aparece en las letras de Sabiá cantou"
        >
            <Music aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            {canciones === 1 ? 'En 1 canción' : `En ${canciones} canciones`}
        </span>
    );
}

/** Encabezado de una palabra: posición, palabra, traducción, tipo y ejemplo. */
export function PalabraCabecera({
    palabra,
    tarjeta,
}: {
    palabra: Palabra;
    tarjeta?: Tarjeta;
}) {
    return (
        <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>Nº {palabra.posicion}</span>
                <span>{tipoLabel(palabra.tipo)}</span>
                <CancionesBadge canciones={palabra.canciones} />
                {tarjeta && <EstadoBadge tarjeta={tarjeta} />}
            </div>
            <p className="mt-1 font-serif text-3xl font-bold break-words text-foreground">
                {palabra.palabra}
            </p>
            <p className="text-lg text-muted-foreground">
                {palabra.traduccion}
            </p>
            {palabra.ejemplo && (
                <p className="mt-2 text-sm">
                    <span className="text-foreground italic">
                        {palabra.ejemplo}
                    </span>
                    {palabra.ejemplo_traduccion && (
                        <span className="text-muted-foreground">
                            {' '}
                            — {palabra.ejemplo_traduccion}
                        </span>
                    )}
                </p>
            )}
        </div>
    );
}
