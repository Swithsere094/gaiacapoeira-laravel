import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

// Callouts para marcar notas editoriales/puntos abiertos dentro de un documento
// MDX (ver content/politica/manual-convivencia.mdx) — se muestran a propósito,
// no se resuelven en código, son decisiones del grupo.

// Bloque: para notas que son su propio párrafo o que envuelven contenido con
// estructura propia (listas anidadas, varios párrafos).
export function NotaPendiente({ children }: { children: ReactNode }) {
    return (
        <div className="my-4 flex items-start gap-2.5 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm print:border-black/40 print:bg-transparent">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent print:text-black" />
            <div className="leading-relaxed text-foreground/90 print:text-black [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mt-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
                <span className="mb-1 block font-semibold text-accent print:text-black">
                    Punto pendiente de definir
                </span>
                {children}
            </div>
        </div>
    );
}

// Inline: para notas cortas incrustadas dentro de un párrafo o un ítem de lista.
export function NotaInline({ children }: { children: ReactNode }) {
    return (
        <span className="inline-flex items-baseline gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[0.85em] font-medium text-accent print:bg-transparent print:text-black print:underline">
            {children}
        </span>
    );
}
