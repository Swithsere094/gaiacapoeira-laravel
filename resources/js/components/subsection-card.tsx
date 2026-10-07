export function SubsectionCard({ children }: { children: React.ReactNode }) {
    return (
        <div
            data-subsection-card
            className="w-[85%] shrink-0 snap-start rounded-xl border border-border bg-card p-6 sm:w-[420px] print:w-full print:shrink print:snap-none print:border-0 print:p-0 [&_h3]:mt-0"
        >
            {children}
        </div>
    );
}
