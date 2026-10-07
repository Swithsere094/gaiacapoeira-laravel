import { AlertTriangle } from "lucide-react"
import type { ReactNode } from "react"

// Callouts para marcar notas editoriales/puntos abiertos dentro de un documento
// MDX (ver content/politica/manual-convivencia.mdx) — se muestran a propósito,
// no se resuelven en código, son decisiones del grupo.

// Bloque: para notas que son su propio párrafo o que envuelven contenido con
// estructura propia (listas anidadas, varios párrafos).
export function NotaPendiente({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 my-4 text-sm print:border-black/40 print:bg-transparent">
      <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5 print:text-black" />
      <div className="text-foreground/90 leading-relaxed print:text-black [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mt-2 [&_ul]:mb-2 [&_ul]:space-y-1 [&_p]:mb-2 [&_p:last-child]:mb-0">
        <span className="font-semibold text-accent print:text-black block mb-1">
          Punto pendiente de definir
        </span>
        {children}
      </div>
    </div>
  )
}

// Inline: para notas cortas incrustadas dentro de un párrafo o un ítem de lista.
export function NotaInline({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-accent text-[0.85em] font-medium print:bg-transparent print:text-black print:underline">
      {children}
    </span>
  )
}
