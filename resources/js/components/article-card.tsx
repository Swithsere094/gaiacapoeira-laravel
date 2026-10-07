import { Link } from "@inertiajs/react"
import { Calendar, Clock, User, ArrowRight } from "lucide-react"

interface ArticleCardProps {
  id: string
  title: string
  excerpt: string
  author: string
  date: string
  readTime: string
  category: string
  slug: string
}

// El texto de las badges usa text-foreground (no el color de la categoría)
// a propósito: text-{color} sobre bg-{color}/20 no cumple el contraste
// mínimo de WCAG AA para texto normal (falla hasta 2:1 en el caso de
// chart-5) — el color solo vive en el fondo, ver auditoría de accesibilidad.
const categoryColors: Record<string, string> = {
  Historia: "bg-primary/20 text-foreground",
  Estilos: "bg-accent/20 text-foreground",
  Música: "bg-chart-4/20 text-foreground",
  Experiencias: "bg-chart-5/20 text-foreground",
  Filosofía: "bg-chart-3/20 text-foreground",
}

export function ArticleCard({
  title,
  excerpt,
  author,
  date,
  readTime,
  category,
  slug,
}: ArticleCardProps) {
  return (
    <article className="group bg-card rounded-xl p-6 hover:shadow-xl transition-all hover:scale-[1.01]">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[category] || "bg-secondary text-secondary-foreground"}`}>
          {category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {readTime}
        </span>
      </div>

      <Link href={`/articulos/${slug}`}>
        <h2 className="font-serif text-xl font-bold text-card-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h2>
      </Link>

      <p className="text-muted-foreground text-sm mb-6 line-clamp-3">
        {excerpt}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" />
            {author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {date}
          </span>
        </div>
        <Link 
          href={`/articulos/${slug}`}
          className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all"
        >
          Leer
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </article>
  )
}
