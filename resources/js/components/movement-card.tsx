
import { useState } from "react"
import { Play, X, ChevronRight, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

interface MovementCardProps {
  id: string
  name: string
  category: string
  difficulty: string
  description: string
  videoUrl: string
  tips: string[]
}

const difficultyColors = {
  "Principiante": "bg-accent text-accent-foreground",
  "Intermedio": "bg-chart-4 text-primary-foreground",
  "Avanzado": "bg-chart-3 text-primary-foreground",
}

const categoryLabels: Record<string, string> = {
  basicos: "Básicos",
  patadas: "Patadas",
  esquivas: "Esquivas",
  acrobacias: "Acrobacias",
  floreios: "Floreios",
}

export function MovementCard({
  name,
  category,
  difficulty,
  description,
  videoUrl,
  tips,
}: MovementCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <article 
        className="group bg-card rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Video Preview */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/80 to-transparent">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2 py-1 bg-secondary/90 rounded text-xs font-medium text-secondary-foreground">
              {categoryLabels[category]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-serif text-xl font-bold text-card-foreground">
              {name}
            </h2>
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium shrink-0",
              difficultyColors[difficulty as keyof typeof difficultyColors]
            )}>
              {difficulty}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
          <span className="inline-flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
            Ver tutorial
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </article>

      {/* Detail Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card rounded-xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-background/80 rounded-full text-foreground hover:text-primary transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video */}
            <div className="aspect-video bg-secondary">
              <iframe
                src={videoUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={name}
              />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="font-serif text-2xl font-bold text-card-foreground">
                  {name}
                </h2>
                <span className="px-2 py-1 bg-secondary rounded text-xs font-medium text-secondary-foreground">
                  {categoryLabels[category]}
                </span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-medium",
                  difficultyColors[difficulty as keyof typeof difficultyColors]
                )}>
                  {difficulty}
                </span>
              </div>

              <p className="text-muted-foreground mb-6">
                {description}
              </p>

              {/* Tips */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="flex items-center gap-2 font-medium text-foreground mb-3">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Consejos
                </h3>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
