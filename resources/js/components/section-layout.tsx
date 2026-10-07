import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { type ReactNode } from "react"

interface SectionLayoutProps {
  children: ReactNode
  title: string
  description: string
}

export function SectionLayout({ children, title, description }: SectionLayoutProps) {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-12 mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
              {title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
      <Footer />
    </main>
  )
}
