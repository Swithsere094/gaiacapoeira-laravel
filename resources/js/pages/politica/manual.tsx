
import { Head, Link } from "@inertiajs/react"
import { ArrowLeft, Download } from "lucide-react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ManualToc } from "@/components/manual-toc"
import ManualContent from "@/content/politica/manual-convivencia.mdx"
import { useMDXComponents } from "@/components/mdx-components"

export default function ManualConvivenciaPage() {
  return (
    <main className="min-h-screen">
      <Head title="Manual de Convivencia y Ética" />
      <div className="print:hidden">
        <Navigation />
      </div>

      <div className="pt-24 pb-16 print:pt-0 print:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-12 mb-2 print:hidden flex items-center justify-between gap-4 flex-wrap">
            <Link
              href="/politica"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Política
            </Link>
            <Button onClick={() => window.print()} className="gap-2 shrink-0">
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
          </div>

          <div className="pt-8 print:pt-0 lg:flex lg:items-start lg:gap-10">
            <ManualToc />
            <article className="min-w-0 flex-1 max-w-3xl">
              <ManualContent components={useMDXComponents({})} />
            </article>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  )
}
