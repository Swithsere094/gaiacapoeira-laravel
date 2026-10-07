export function SubsectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-subsection-card
      className="shrink-0 snap-start w-[85%] sm:w-[420px] rounded-xl border border-border bg-card p-6 print:w-full print:border-0 print:p-0 print:shrink print:snap-none [&_h3]:mt-0"
    >
      {children}
    </div>
  )
}
