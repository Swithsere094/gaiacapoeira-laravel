import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { ManualToc } from '@/components/manual-toc';
import ManualContent from '@/content/politica/manual-convivencia.mdx';
import { useMDXComponents } from '@/components/mdx-components';

export default function ManualConvivenciaPage() {
    return (
        <main className="min-h-screen">
            <Head title="Manual de Convivencia y Ética" />
            <div className="print:hidden">
                <Navigation />
            </div>

            <div className="pt-24 pb-16 print:pt-0 print:pb-0">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-4 pt-12 print:hidden">
                        <Link
                            href="/politica"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Volver a Política
                        </Link>
                        <Button
                            onClick={() => window.print()}
                            className="shrink-0 gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Descargar PDF
                        </Button>
                    </div>

                    <div className="pt-8 lg:flex lg:items-start lg:gap-10 print:pt-0">
                        <ManualToc />
                        <article className="max-w-3xl min-w-0 flex-1">
                            <ManualContent components={useMDXComponents({})} />
                        </article>
                    </div>
                </div>
            </div>

            <div className="print:hidden">
                <Footer />
            </div>
        </main>
    );
}
