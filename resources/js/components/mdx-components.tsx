import type { MDXComponents } from 'mdx/types';

// Mapea los tags que genera el MDX a los tokens tipográficos del sitio
// (mismo font-serif/foreground que usan las demás páginas), para que un
// documento .mdx se vea consistente sin tener que repetir clases en cada uno.
// print:text-black fuerza texto legible en el PDF generado con window.print(),
// ya que text-foreground puede resolver a un color claro en tema oscuro.
export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        h1: (props) => (
            <h1
                className="mt-10 mb-4 font-serif text-3xl font-bold text-foreground first:mt-0 md:text-4xl print:text-black"
                {...props}
            />
        ),
        h2: (props) => (
            <h2
                className="mt-8 mb-3 font-serif text-2xl font-bold text-foreground print:break-inside-avoid print:text-black"
                {...props}
            />
        ),
        h3: (props) => (
            <h3
                className="mt-6 mb-2 font-serif text-xl font-bold text-foreground print:break-inside-avoid print:text-black"
                {...props}
            />
        ),
        p: (props) => (
            <p
                className="mb-4 leading-relaxed text-foreground print:text-black"
                {...props}
            />
        ),
        ul: (props) => (
            <ul
                className="mb-4 list-disc space-y-1.5 pl-6 text-foreground print:text-black"
                {...props}
            />
        ),
        ol: (props) => (
            <ol
                className="mb-4 list-decimal space-y-1.5 pl-6 text-foreground print:text-black"
                {...props}
            />
        ),
        li: (props) => <li className="leading-relaxed" {...props} />,
        strong: (props) => (
            <strong
                className="font-semibold text-foreground print:text-black"
                {...props}
            />
        ),
        a: (props) => (
            <a
                className="text-primary underline underline-offset-2 hover:no-underline"
                {...props}
            />
        ),
        blockquote: (props) => (
            <blockquote
                className="my-4 border-l-4 border-primary/40 pl-4 text-muted-foreground italic print:text-black"
                {...props}
            />
        ),
        hr: (props) => <hr className="my-8 border-border" {...props} />,
        ...components,
    };
}
