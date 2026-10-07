import { Link } from '@inertiajs/react';
import { Play, ScrollText, Music, ArrowRight } from 'lucide-react';

const sections = [
    {
        href: '/galera',
        title: 'Galera',
        description: 'Rodas y cantorias de nuestra comunidad',
        icon: Play,
        color: 'bg-primary',
    },
    {
        href: '/canciones',
        title: 'Sabiá cantou',
        description: 'Cancionero para que no pares de cantar en la roda',
        icon: Music,
        color: 'bg-chart-5',
    },
    {
        href: '/politica',
        title: 'Política',
        description:
            'Manual de convivencia, cordas de graduación y documentos del grupo',
        icon: ScrollText,
        color: 'bg-chart-4',
    },
];

export function Hero() {
    return (
        <section className="min-h-screen">
            {/* Hero Banner */}
            <div className="relative overflow-hidden pt-24">
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a574' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,
                    }}
                />
                <div className="relative flex h-[60vh] min-h-[400px] items-center justify-center">
                    <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-primary">
                            <span className="text-sm font-medium">
                                Repositorio Digital
                            </span>
                        </div>
                        <h1 className="mb-6 font-serif text-5xl font-bold text-balance text-foreground md:text-7xl">
                            Areia no Mar
                        </h1>
                        <p className="mx-auto mb-8 max-w-2xl text-xl text-pretty text-muted-foreground md:text-2xl">
                            Un espacio para preservar y compartir nuestra
                            cultura, música y conocimiento
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/galera"
                                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Explorar Galera
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/canciones"
                                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                            >
                                Sabiá cantou
                            </Link>
                            <Link
                                href="/politica"
                                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                            >
                                Política
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Grid */}
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                className="group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-[1.02] hover:shadow-xl"
                                style={{ backgroundColor: 'var(--card)' }}
                            >
                                <div
                                    className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full opacity-20 transition-transform group-hover:scale-150"
                                    style={{
                                        backgroundColor: `var(--${section.color.replace('bg-', '')})`,
                                    }}
                                />
                                <div
                                    className={`inline-flex rounded-xl p-3 ${section.color} mb-4`}
                                >
                                    <Icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h2 className="mb-2 font-serif text-2xl font-bold text-card-foreground">
                                    {section.title}
                                </h2>
                                <p className="mb-4 text-muted-foreground">
                                    {section.description}
                                </p>
                                <span className="inline-flex items-center gap-1 font-medium text-primary transition-all group-hover:gap-2">
                                    Explorar
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
