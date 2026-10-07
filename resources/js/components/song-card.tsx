
import { useState } from "react"
import { Play, BookOpen, History, Maximize2, Pencil, Trash2, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { toEmbedUrl } from "@/lib/utils/video-url"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface SongCardProps {
  id: string
  title: string
  type: string
  lyrics: string
  translation: string
  history: string
  videoUrl: string
  mestre?: string
  ritmos?: string[]
  nossa?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

type Tab = "lyrics" | "translation" | "history"

const typeLabels: Record<string, string> = {
  ladainha: "Ladainha",
  corrido: "Corrido",
  quadra: "Quadra",
  chula: "Chula",
  samba: "Samba",
}

// text-foreground a propósito (no el color del ritmo): text-{color} sobre
// bg-{color}/20 no cumple el contraste mínimo de WCAG AA — ver auditoría
// de accesibilidad. El color queda solo en el fondo.
const typeColors: Record<string, string> = {
  ladainha: "bg-primary/20 text-foreground",
  corrido: "bg-accent/20 text-foreground",
  quadra: "bg-chart-4/20 text-foreground",
  chula: "bg-chart-5/20 text-foreground",
  samba: "bg-chart-3/20 text-foreground",
}

function SongMeta({
  type,
  ritmos,
  mestre,
  nossa,
}: {
  type: string
  ritmos?: string[]
  mestre?: string
  nossa?: boolean
}) {
  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      {nossa && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground">
          <Star aria-hidden="true" className="w-3 h-3 fill-current" />
          Nossa
        </span>
      )}
      <span
        className={cn(
          "inline-block px-2 py-0.5 rounded text-xs font-medium",
          typeColors[type] ?? "bg-secondary text-secondary-foreground"
        )}
      >
        {typeLabels[type] ?? type}
      </span>
      {ritmos?.map((r) => (
        <span
          key={r}
          className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground"
        >
          {r}
        </span>
      ))}
      {mestre && <span className="text-xs text-muted-foreground">{mestre}</span>}
    </div>
  )
}

export function SongCard({
  title,
  type,
  lyrics,
  translation,
  history,
  videoUrl,
  mestre,
  ritmos,
  nossa,
  onEdit,
  onDelete,
}: SongCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("lyrics")

  const embedUrl = videoUrl ? toEmbedUrl(videoUrl) : ""

  const open = () => {
    setActiveTab("lyrics")
    setIsOpen(true)
  }

  const tabs: { id: Tab; label: string; icon: typeof BookOpen; show: boolean }[] = [
    { id: "lyrics", label: "Letra", icon: BookOpen, show: true },
    { id: "translation", label: "Traducción", icon: BookOpen, show: !!translation },
    { id: "history", label: "Historia", icon: History, show: !!history },
  ]
  const visibleTabs = tabs.filter((t) => t.show)

  return (
    <>
      <article className="bg-card rounded-xl overflow-hidden">
        {/* Toda la tarjeta abre el modal. Editar/borrar son botones
            hermanos, no anidados: un <button> dentro de otro confunde a
            lectores de pantalla y rompe el orden de foco (ver auditoría de
            a11y). El ícono de play es solo indicativo de que hay video. */}
        <div className="flex items-center hover:bg-secondary/30 transition-colors">
          <button
            type="button"
            onClick={open}
            aria-haspopup="dialog"
            className="flex-1 min-w-0 p-6 flex items-center justify-between text-left gap-3"
          >
            <div className="flex items-center gap-4 min-w-0">
              {embedUrl && (
                <div
                  aria-hidden="true"
                  className="w-12 h-12 shrink-0 rounded-full bg-primary/20 flex items-center justify-center"
                >
                  <Play className="w-5 h-5 text-primary ml-0.5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-serif text-xl font-bold text-card-foreground truncate">
                  {title}
                  {embedUrl && <span className="sr-only"> (con video)</span>}
                </h3>
                <SongMeta type={type} ritmos={ritmos} mestre={mestre} nossa={nossa} />
              </div>
            </div>

            <Maximize2 aria-hidden="true" className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>

          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2 shrink-0 pr-6">
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Editar canción"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Eliminar canción"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </article>

      {/* Modal: letra a la izquierda, video a la derecha, cada columna con
          su propio scroll. En pantallas chicas el video queda fijo arriba y
          la letra scrollea debajo. Radix desmonta el contenido al cerrar,
          así que el iframe se destruye y el video deja de sonar. */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          aria-describedby={undefined}
          className={cn(
            "flex flex-col gap-0 p-0 overflow-hidden h-[90vh]",
            embedUrl ? "sm:max-w-6xl" : "sm:max-w-3xl"
          )}
        >
          <DialogHeader className="shrink-0 text-left p-6 pr-12 border-b border-border">
            <DialogTitle className="font-serif text-2xl font-bold">{title}</DialogTitle>
            <SongMeta type={type} ritmos={ritmos} mestre={mestre} nossa={nossa} />
          </DialogHeader>

          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            {embedUrl && (
              <div className="shrink-0 lg:order-last lg:flex-1 lg:min-w-0 lg:overflow-y-auto p-4 lg:p-6 border-b lg:border-b-0 lg:border-l border-border">
                <div className="aspect-video w-full bg-card rounded-lg overflow-hidden">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Video: ${title}`}
                  />
                </div>
              </div>
            )}

            <div
              className={cn(
                "flex-1 min-h-0 flex flex-col",
                embedUrl && "lg:flex-none lg:w-[42%]"
              )}
            >
              {visibleTabs.length > 1 && (
                <div role="tablist" className="shrink-0 flex border-b border-border">
                  {visibleTabs.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={activeTab === id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        activeTab === id
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <div role="tabpanel" className="flex-1 min-h-0 overflow-y-auto p-6">
                {activeTab === "lyrics" && (
                  <pre className="font-sans text-foreground whitespace-pre-wrap leading-relaxed">
                    {lyrics}
                  </pre>
                )}
                {activeTab === "translation" && (
                  <pre className="font-sans text-foreground whitespace-pre-wrap leading-relaxed">
                    {translation}
                  </pre>
                )}
                {activeTab === "history" && (
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{history}</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
