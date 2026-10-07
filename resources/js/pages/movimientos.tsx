
import { useState } from "react"
import { SectionLayout } from "@/components/section-layout"
import { MovementCard } from "@/components/movement-card"
import { Search, Filter } from "lucide-react"

const categories = [
  { id: "all", label: "Todos" },
  { id: "basicos", label: "Básicos" },
  { id: "patadas", label: "Patadas" },
  { id: "esquivas", label: "Esquivas" },
  { id: "acrobacias", label: "Acrobacias" },
  { id: "floreios", label: "Floreios" },
]

const movements = [
  {
    id: "1",
    name: "Ginga",
    category: "basicos",
    difficulty: "Principiante",
    description: "El movimiento fundamental de la capoeira. Es la base de todos los demás movimientos y define el ritmo del juego.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Mantén el peso distribuido", "Los brazos protegen el rostro", "Sigue el ritmo del berimbau"],
  },
  {
    id: "2",
    name: "Meia Lua de Frente",
    category: "patadas",
    difficulty: "Principiante",
    description: "Patada semicircular frontal. Una de las primeras patadas que se aprenden en capoeira.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Gira desde la cadera", "Mantén la pierna de apoyo firme", "El pie describe un arco"],
  },
  {
    id: "3",
    name: "Esquiva Lateral",
    category: "esquivas",
    difficulty: "Principiante",
    description: "Movimiento defensivo básico para evitar ataques laterales manteniendo la posición de juego.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Flexiona las rodillas", "Mantén los ojos en el oponente", "Prepárate para contraatacar"],
  },
  {
    id: "4",
    name: "Aú",
    category: "acrobacias",
    difficulty: "Principiante",
    description: "La rueda de carro de capoeira. Movimiento de transición y evasión muy versátil.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Las manos se colocan una después de otra", "Mantén las piernas separadas", "Mira hacia donde vas"],
  },
  {
    id: "5",
    name: "Armada",
    category: "patadas",
    difficulty: "Intermedio",
    description: "Patada giratoria con el talón. Muy efectiva y uno de los movimientos más icónicos.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["El giro viene de la cadera", "Extiende la pierna en el momento justo", "Mantén el equilibrio al girar"],
  },
  {
    id: "6",
    name: "Queda de Rins",
    category: "acrobacias",
    difficulty: "Intermedio",
    description: "Posición de apoyo sobre el codo. Base para muchos movimientos acrobáticos.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["El codo va en el abdomen", "Distribuye el peso correctamente", "Practica cerca del suelo primero"],
  },
  {
    id: "7",
    name: "Macaco",
    category: "acrobacias",
    difficulty: "Intermedio",
    description: "Salto mortal hacia atrás con apoyo de manos. Espectacular y útil para evadir.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Impulsa con las piernas", "Las manos tocan el suelo primero", "Arquea la espalda"],
  },
  {
    id: "8",
    name: "Meia Lua de Compasso",
    category: "patadas",
    difficulty: "Intermedio",
    description: "Patada giratoria con las manos en el suelo. Movimiento elegante y poderoso.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Coloca las manos firmemente", "La pierna describe un compás completo", "Mira entre las piernas"],
  },
  {
    id: "9",
    name: "Parafuso",
    category: "floreios",
    difficulty: "Avanzado",
    description: "Movimiento de giro en el aire con las piernas extendidas. Muy vistoso y técnico.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Requiere buen impulso vertical", "Mantén el cuerpo compacto", "Practica primero el giro en el suelo"],
  },
  {
    id: "10",
    name: "S-Dobrado",
    category: "floreios",
    difficulty: "Avanzado",
    description: "Movimiento acrobático avanzado que combina giro y inversión del cuerpo.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Domina primero el aú y macaco", "El cuerpo forma una S", "Practica con colchoneta"],
  },
  {
    id: "11",
    name: "Negativa",
    category: "esquivas",
    difficulty: "Principiante",
    description: "Posición baja defensiva con una pierna extendida. Permite transiciones fluidas.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Mantén la espalda cerca del suelo", "Una mano protege el rostro", "Prepárate para rolar"],
  },
  {
    id: "12",
    name: "Rasteira",
    category: "patadas",
    difficulty: "Intermedio",
    description: "Barrido bajo para desequilibrar al oponente. Técnica efectiva de defensa.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    tips: ["Timing es crucial", "Barre el tobillo de apoyo", "Mantente bajo para estabilidad"],
  },
]

export default function MovimientosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredMovements = movements.filter((movement) => {
    const matchesSearch = movement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || movement.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <SectionLayout
      title="Movimientos"
      description="Biblioteca completa de movimientos de capoeira. Aprende desde los fundamentos hasta técnicas avanzadas."
    >
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar movimientos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-muted-foreground mb-6">
        {filteredMovements.length} movimiento{filteredMovements.length !== 1 ? "s" : ""} encontrado{filteredMovements.length !== 1 ? "s" : ""}
      </p>

      {/* Movements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovements.map((movement) => (
          <MovementCard key={movement.id} {...movement} />
        ))}
      </div>

      {filteredMovements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No se encontraron movimientos con esos criterios.</p>
        </div>
      )}
    </SectionLayout>
  )
}
