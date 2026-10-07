import type { MDXComponents } from "mdx/types"

// Mapea los tags que genera el MDX a los tokens tipográficos del sitio
// (mismo font-serif/foreground que usan las demás páginas), para que un
// documento .mdx se vea consistente sin tener que repetir clases en cada uno.
// print:text-black fuerza texto legible en el PDF generado con window.print(),
// ya que text-foreground puede resolver a un color claro en tema oscuro.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => (
      <h1
        className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-10 mb-4 first:mt-0 print:text-black"
        {...props}
      />
    ),
    h2: (props) => (
      <h2
        className="font-serif text-2xl font-bold text-foreground mt-8 mb-3 print:text-black print:break-inside-avoid"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="font-serif text-xl font-bold text-foreground mt-6 mb-2 print:text-black print:break-inside-avoid"
        {...props}
      />
    ),
    p: (props) => (
      <p className="text-foreground leading-relaxed mb-4 print:text-black" {...props} />
    ),
    ul: (props) => (
      <ul className="list-disc pl-6 space-y-1.5 mb-4 text-foreground print:text-black" {...props} />
    ),
    ol: (props) => (
      <ol className="list-decimal pl-6 space-y-1.5 mb-4 text-foreground print:text-black" {...props} />
    ),
    li: (props) => <li className="leading-relaxed" {...props} />,
    strong: (props) => <strong className="font-semibold text-foreground print:text-black" {...props} />,
    a: (props) => (
      <a
        className="text-primary underline underline-offset-2 hover:no-underline"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4 print:text-black"
        {...props}
      />
    ),
    hr: (props) => <hr className="border-border my-8" {...props} />,
    ...components,
  }
}
