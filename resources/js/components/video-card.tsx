import { useState } from 'react';
import { Play, Calendar, MapPin, Eye, X, Trash2 } from 'lucide-react';
import { toEmbedUrl, getYouTubeThumbnail } from '@/lib/utils/video-url';

export interface VideoCardProps {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    location?: string;
    eventDate?: string;
    views?: number;
    onDelete?: () => void;
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
    const [isModalOpen, setIsModalOpen] = useState(false);

    const embedUrl = toEmbedUrl(videoUrl);
    const thumbnail = getYouTubeThumbnail(videoUrl);

    const formattedDate = eventDate
        ? new Date(eventDate).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : null;

    return (
        <>
            <article className="group relative cursor-pointer overflow-hidden rounded-xl bg-card transition-all hover:scale-[1.02] hover:shadow-xl">
                {/* Delete button */}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute top-2 right-2 z-10 rounded-md bg-background/80 p-1.5 text-muted-foreground opacity-0 transition-colors group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Eliminar roda"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}

                {/* Thumbnail */}
                <div
                    className="relative aspect-video overflow-hidden bg-secondary"
                    onClick={() => setIsModalOpen(true)}
                >
                    {thumbnail ? (
                        <img
                            src={thumbnail}
                            alt={title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 shadow-lg transition-transform group-hover:scale-110">
                            <Play className="ml-1 h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5" onClick={() => setIsModalOpen(true)}>
                    <h3 className="mb-2 line-clamp-1 font-serif text-lg font-bold text-card-foreground">
                        {title}
                    </h3>
                    {description && (
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {formattedDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formattedDate}
                            </span>
                        )}
                        {location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {location}
                            </span>
                        )}
                        {typeof views === 'number' && views > 0 && (
                            <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {views}
                            </span>
                        )}
                    </div>
                </div>
            </article>

            {/* Video Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-2 text-foreground transition-colors hover:text-primary"
                            aria-label="Cerrar video"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title}
                            />
                        ) : (
                            <p className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
                                Este video no se puede reproducir aquí.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
