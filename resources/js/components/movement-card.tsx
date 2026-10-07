import { useState } from 'react';
import { Play, X, ChevronRight, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MovementCardProps {
    id: string;
    name: string;
    category: string;
    difficulty: string;
    description: string;
    videoUrl: string;
    tips: string[];
}

const difficultyColors = {
    Principiante: 'bg-accent text-accent-foreground',
    Intermedio: 'bg-chart-4 text-primary-foreground',
    Avanzado: 'bg-chart-3 text-primary-foreground',
};

const categoryLabels: Record<string, string> = {
    basicos: 'Básicos',
    patadas: 'Patadas',
    esquivas: 'Esquivas',
    acrobacias: 'Acrobacias',
    floreios: 'Floreios',
};

export function MovementCard({
    name,
    category,
    difficulty,
    description,
    videoUrl,
    tips,
}: MovementCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <article
                className="group cursor-pointer overflow-hidden rounded-xl bg-card transition-all hover:scale-[1.02] hover:shadow-xl"
                onClick={() => setIsModalOpen(true)}
            >
                {/* Video Preview */}
                <div className="relative aspect-video overflow-hidden bg-secondary">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-background/80 to-transparent">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 transition-transform group-hover:scale-110">
                            <Play className="ml-1 h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <div className="absolute top-3 left-3 flex gap-2">
                        <span className="rounded bg-secondary/90 px-2 py-1 text-xs font-medium text-secondary-foreground">
                            {categoryLabels[category]}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <h2 className="font-serif text-xl font-bold text-card-foreground">
                            {name}
                        </h2>
                        <span
                            className={cn(
                                'shrink-0 rounded px-2 py-1 text-xs font-medium',
                                difficultyColors[
                                    difficulty as keyof typeof difficultyColors
                                ],
                            )}
                        >
                            {difficulty}
                        </span>
                    </div>
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                        {description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-all group-hover:gap-2">
                        Ver tutorial
                        <ChevronRight className="h-4 w-4" />
                    </span>
                </div>
            </article>

            {/* Detail Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/95 p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="relative my-8 w-full max-w-3xl overflow-hidden rounded-xl bg-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 z-10 rounded-full bg-background/80 p-2 text-foreground transition-colors hover:text-primary"
                            aria-label="Cerrar"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Video */}
                        <div className="aspect-video bg-secondary">
                            <iframe
                                src={videoUrl}
                                className="h-full w-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={name}
                            />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <h2 className="font-serif text-2xl font-bold text-card-foreground">
                                    {name}
                                </h2>
                                <span className="rounded bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                    {categoryLabels[category]}
                                </span>
                                <span
                                    className={cn(
                                        'rounded px-2 py-1 text-xs font-medium',
                                        difficultyColors[
                                            difficulty as keyof typeof difficultyColors
                                        ],
                                    )}
                                >
                                    {difficulty}
                                </span>
                            </div>

                            <p className="mb-6 text-muted-foreground">
                                {description}
                            </p>

                            {/* Tips */}
                            <div className="rounded-lg bg-secondary/50 p-4">
                                <h3 className="mb-3 flex items-center gap-2 font-medium text-foreground">
                                    <Lightbulb className="h-5 w-5 text-primary" />
                                    Consejos
                                </h3>
                                <ul className="space-y-2">
                                    {tips.map((tip, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2 text-sm text-muted-foreground"
                                        >
                                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
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
    );
}
