
import { useEffect, useState } from "react"
import { List } from "lucide-react"
import { cn } from "@/lib/utils"
import { MANUAL_SECTIONS } from "@/lib/constants/manual-sections"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export function ManualToc() {
  const [activeId, setActiveId] = useState<string>(MANUAL_SECTIONS[0].id)

  useEffect(() => {
    const elements = MANUAL_SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    )
    if (elements.length === 0) return

    // rootMargin negativo arriba compensa el header fijo; el negativo abajo
    // hace que una sección se marque "activa" apenas su título entra al
    // tercio superior de la pantalla, no recién cuando ocupa todo el viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const top = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b))
        setActiveId(top.target.id)
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeTitle = MANUAL_SECTIONS.find((s) => s.id === activeId)?.title

  return (
    <>
      <div className="lg:hidden print:hidden mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto justify-start">
              <List className="w-4 h-4 shrink-0" />
              <span className="truncate">Índice — {activeTitle}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto">
            {MANUAL_SECTIONS.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => jumpTo(s.id)}
                className={cn("cursor-pointer", activeId === s.id && "text-primary font-medium")}
              >
                {s.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav
        aria-label="Índice del manual"
        className="hidden lg:block sticky top-28 self-start w-56 shrink-0 print:hidden"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Índice
        </p>
        <ul className="space-y-1 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
          {MANUAL_SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                className={cn(
                  "text-left w-full text-sm py-1.5 px-2 rounded-md transition-colors",
                  activeId === s.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
