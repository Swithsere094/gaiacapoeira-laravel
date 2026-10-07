import { Link } from "@inertiajs/react"
import { Play, ScrollText, Music, ArrowRight } from "lucide-react"

const sections = [
  {
    href: "/galera",
    title: "Galera",
    description: "Rodas y cantorias de nuestra comunidad",
    icon: Play,
    color: "bg-primary",
  },
  {
    href: "/canciones",
    title: "Sabiá cantou",
    description: "Cancionero para que no pares de cantar en la roda",
    icon: Music,
    color: "bg-chart-5",
  },
  {
    href: "/politica",
    title: "Política",
    description: "Manual de convivencia, cordas de graduación y documentos del grupo",
    icon: ScrollText,
    color: "bg-chart-4",
  },
]

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
        <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center">
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-6">
              <span className="text-sm font-medium">Repositorio Digital</span>
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-foreground mb-6 text-balance">
              Areia no Mar
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
              Un espacio para preservar y compartir nuestra cultura, música y conocimiento
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/galera"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Explorar Galera
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/canciones"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Sabiá cantou
              </Link>
              <Link
                href="/politica"
                className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors"
              >
                Política
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Section Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group relative overflow-hidden rounded-2xl p-8 transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{ backgroundColor: "var(--card)" }}
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-20 transition-transform group-hover:scale-150"
                  style={{ backgroundColor: `var(--${section.color.replace("bg-", "")})` }}
                />
                <div className={`inline-flex p-3 rounded-xl ${section.color} mb-4`}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-card-foreground mb-2">
                  {section.title}
                </h2>
                <p className="text-muted-foreground mb-4">{section.description}</p>
                <span className="inline-flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                  Explorar
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
