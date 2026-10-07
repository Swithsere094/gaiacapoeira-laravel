
import { Head, Link } from "@inertiajs/react"
import { ArrowLeft, Download } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CORDAS, getCordaSrc, type CordaGroup } from "@/lib/constants/cordas"

// Mismo truco de posicionamiento que CordaAvatar en components/navigation.tsx:
// los PNG de /Cuerda x cuerda/ tienen mucho margen transparente y el dibujo no
// está centrado verticalmente — translateY corrige eso antes del scale (por
// eso va primero, así no se amplifica con el scale que le sigue).
function CordaImage({ src }: { src: string | null }) {
  if (!src) return null
  return (
    <div className="w-20 h-20 shrink-0 overflow-hidden flex items-center justify-center">
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain"
        style={{ transform: "translateY(9.6%) scale(1.8)" }}
      />
    </div>
  )
}

// Títulos en portugués, como aparecen en el PDF original de graduaciones
// (Mirins / Alunos / Avançados / Formados / Mestres).
const SECTIONS: { group: CordaGroup; title: string }[] = [
  { group: "estagiario", title: "Estagiários" },
  { group: "mirim", title: "Mirins" },
  { group: "alumno", title: "Alunos" },
  { group: "avanzado", title: "Avançados" },
  { group: "formado", title: "Formados" },
  { group: "maestros", title: "Mestres" },
]

export default function CordasPage() {
  return (
    <main className="min-h-screen">
      <Head title="Sistema de Cordas" />
      <div className="print:hidden">
        <Navigation />
      </div>

      <div className="pt-24 pb-16 print:pt-0 print:pb-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-12 mb-10 print:pt-0 print:mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link
                href="/politica"
                className="print:hidden inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Política
              </Link>
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 print:text-black">
                Sistema de Cordas
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl print:text-black">
                Orden de graduación del grupo, de batizado a grão-mestre.
              </p>
            </div>
            <Button onClick={() => window.print()} className="gap-2 shrink-0 print:hidden">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </div>

          <div className="space-y-12 print:space-y-8">
            {SECTIONS.map(({ group, title }) => (
              <section key={group} className="print:break-inside-avoid">
                <h2 className="font-serif text-2xl font-bold text-foreground mb-5 print:text-black">
                  {title}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {CORDAS.filter((c) => c.group === group).map((corda) => (
                    <div
                      key={corda.id}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card text-center print:break-inside-avoid print:border print:border-black/10 print:bg-white"
                    >
                      <CordaImage src={getCordaSrc(corda.id)} />
                      <span className="text-sm font-medium text-card-foreground print:text-black">
                        {corda.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  )
}
