// scroll-mt-28 evita que el header fijo (components/navigation.tsx, hasta
// h-24) tape el encabezado al saltar acá desde ManualToc o un link con #hash.
export function ManualSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      {children}
    </section>
  )
}
