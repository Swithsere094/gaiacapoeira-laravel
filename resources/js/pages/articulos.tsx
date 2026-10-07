import { SectionLayout } from "@/components/section-layout"
import { ArticleCard } from "@/components/article-card"
import { Link } from "@inertiajs/react"
import { PenLine } from "lucide-react"

const articles = [
  {
    id: "1",
    title: "La Historia de la Capoeira: De las Senzalas a las Academias",
    excerpt: "Un recorrido por los orígenes africanos de la capoeira, su desarrollo durante la esclavitud en Brasil, y cómo se transformó de una práctica prohibida a un patrimonio cultural reconocido mundialmente.",
    author: "Mestre Carlos",
    date: "15 de Octubre, 2024",
    readTime: "12 min",
    category: "Historia",
    slug: "historia-capoeira",
  },
  {
    id: "2",
    title: "Capoeira Angola vs Regional: Diferencias y Filosofías",
    excerpt: "Exploramos las dos principales vertientes de la capoeira, sus fundadores, características distintivas y cómo cada una preserva diferentes aspectos de esta arte marcial brasileña.",
    author: "Professora Ana",
    date: "8 de Octubre, 2024",
    readTime: "8 min",
    category: "Estilos",
    slug: "angola-vs-regional",
  },
  {
    id: "3",
    title: "El Berimbau: El Alma de la Roda",
    excerpt: "Todo sobre el instrumento más importante de la capoeira. Su construcción, los diferentes toques, su significado espiritual y cómo aprender a tocarlo correctamente.",
    author: "Contra-Mestre João",
    date: "1 de Octubre, 2024",
    readTime: "10 min",
    category: "Música",
    slug: "berimbau-alma-roda",
  },
  {
    id: "4",
    title: "Mi Primera Roda: Consejos para Principiantes",
    excerpt: "Recuerdos de mi primera experiencia en una roda y consejos prácticos para aquellos que están comenzando su camino en la capoeira. Qué esperar y cómo prepararse.",
    author: "Graduado Pedro",
    date: "22 de Septiembre, 2024",
    readTime: "6 min",
    category: "Experiencias",
    slug: "primera-roda-consejos",
  },
  {
    id: "5",
    title: "Mestre Bimba: El Revolucionario de la Capoeira",
    excerpt: "La vida y legado de Manoel dos Reis Machado, conocido como Mestre Bimba, creador de la Capoeira Regional y figura fundamental en la legitimación de este arte.",
    author: "Mestre Carlos",
    date: "15 de Septiembre, 2024",
    readTime: "15 min",
    category: "Historia",
    slug: "mestre-bimba",
  },
  {
    id: "6",
    title: "La Importancia del Axé en la Capoeira",
    excerpt: "Más allá de ser un saludo, el axé representa la energía vital que fluye en la roda. Exploramos su significado espiritual y cómo cultivarlo en nuestra práctica.",
    author: "Professora Ana",
    date: "8 de Septiembre, 2024",
    readTime: "7 min",
    category: "Filosofía",
    slug: "importancia-axe",
  },
]

const categories = ["Todos", "Historia", "Estilos", "Música", "Experiencias", "Filosofía"]

export default function ArticulosPage() {
  return (
    <SectionLayout
      title="Artículos"
      description="Escritos por miembros de nuestra comunidad sobre historia, técnicas, filosofía y experiencias en la capoeira."
    >
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === "Todos"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Write Article CTA */}
      <div className="bg-card rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <PenLine className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-foreground">¿Quieres compartir tu conocimiento?</h2>
            <p className="text-sm text-muted-foreground">Los miembros del grupo pueden enviar artículos para publicar.</p>
          </div>
        </div>
        <Link
          href="#"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Escribir Artículo
        </Link>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} {...article} />
        ))}
      </div>
    </SectionLayout>
  )
}
