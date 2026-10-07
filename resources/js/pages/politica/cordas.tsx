import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { CORDAS, getCordaSrc, type CordaGroup } from '@/lib/constants/cordas';

// Mismo truco de posicionamiento que CordaAvatar en components/navigation.tsx:
// los PNG de /Cuerda x cuerda/ tienen mucho margen transparente y el dibujo no
// está centrado verticalmente — translateY corrige eso antes del scale (por
// eso va primero, así no se amplifica con el scale que le sigue).
function CordaImage({ src }: { src: string | null }) {
    if (!src) return null;
    return (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden">
            <img
                src={src}
                alt=""
                className="h-full w-full object-contain"
                style={{ transform: 'translateY(9.6%) scale(1.8)' }}
            />
        </div>
    );
}

// Títulos en portugués, como aparecen en el PDF original de graduaciones
// (Mirins / Alunos / Avançados / Formados / Mestres).
const SECTIONS: { group: CordaGroup; title: string }[] = [
    { group: 'estagiario', title: 'Estagiários' },
    { group: 'mirim', title: 'Mirins' },
    { group: 'alumno', title: 'Alunos' },
    { group: 'avanzado', title: 'Avançados' },
    { group: 'formado', title: 'Formados' },
    { group: 'maestros', title: 'Mestres' },
];

export default function CordasPage() {
    return (
        <main className="min-h-screen">
            <Head title="Sistema de Cordas" />
            <div className="print:hidden">
                <Navigation />
            </div>

            <div className="pt-24 pb-16 print:pt-0 print:pb-0">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 flex flex-wrap items-start justify-between gap-4 pt-12 print:mb-6 print:pt-0">
                        <div>
                            <Link
                                href="/politica"
                                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary print:hidden"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Volver a Política
                            </Link>
                            <h1 className="mb-4 font-serif text-4xl font-bold text-foreground md:text-5xl print:text-black">
                                Sistema de Cordas
                            </h1>
                            <p className="max-w-2xl text-xl text-muted-foreground print:text-black">
                                Orden de graduación del grupo, de batizado a
                                grão-mestre.
                            </p>
                        </div>
                        <Button
                            onClick={() => window.print()}
                            className="shrink-0 gap-2 print:hidden"
                        >
                            <Download className="h-4 w-4" />
                            Descargar PDF
                        </Button>
                    </div>

                    <div className="space-y-12 print:space-y-8">
                        {SECTIONS.map(({ group, title }) => (
                            <section
                                key={group}
                                className="print:break-inside-avoid"
                            >
                                <h2 className="mb-5 font-serif text-2xl font-bold text-foreground print:text-black">
                                    {title}
                                </h2>
                                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                                    {CORDAS.filter(
                                        (c) => c.group === group,
                                    ).map((corda) => (
                                        <div
                                            key={corda.id}
                                            className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 text-center print:break-inside-avoid print:border print:border-black/10 print:bg-white"
                                        >
                                            <CordaImage
                                                src={getCordaSrc(corda.id)}
                                            />
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
    );
}
