
import { useState } from "react"
import { Play, Calendar, MapPin, Eye, X, Trash2 } from "lucide-react"
import { toEmbedUrl, getYouTubeThumbnail } from "@/lib/utils/video-url"

export interface VideoCardProps {
  id: string
  title: string
  description: string
  videoUrl: string
  location?: string
  eventDate?: string
  views?: number
  onDelete?: () => void
}

export function VideoCard({
  title,
  description,
  videoUrl,
  location,
  eventDate,
  views,
  onDelete,
}: VideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const embedUrl = toEmbedUrl(videoUrl)
  const thumbnail = getYouTubeThumbnail(videoUrl)

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <>
      <article className="group bg-card rounded-xl overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] relative">
        {/* Delete button */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-background/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Eliminar roda"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        {/* Thumbnail */}
        <div
          className="relative aspect-video bg-secondary overflow-hidden"
          onClick={() => setIsModalOpen(true)}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5" onClick={() => setIsModalOpen(true)}>
          <h3 className="font-serif text-lg font-bold text-card-foreground mb-2 line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {location}
              </span>
            )}
            {typeof views === "number" && views > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {views}
              </span>
            )}
          </div>
        </div>
      </article>

      {/* Video Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-card rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/80 text-foreground hover:text-primary transition-colors"
              aria-label="Cerrar video"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          </div>
        </div>
      )}
    </>
  )
}
