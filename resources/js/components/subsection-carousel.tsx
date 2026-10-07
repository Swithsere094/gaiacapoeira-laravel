import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Carrusel horizontal con scroll-snap nativo (sin animation-timeline: el
// soporte de scroll-driven animations en Firefox sigue detrás de flag a
// mediados de 2026, así que no es confiable como mecanismo de navegación).
// print:contents "desenvuelve" el contenedor para que las tarjetas impriman
// en flujo normal vertical en vez de quedar recortadas por el overflow-x.
export function SubsectionCarousel({
    children,
    label,
}: {
    children: React.ReactNode;
    // Identifica de qué sección son las subsecciones (ej. "Principios
    // Fundamentales"). Varios carruseles conviven en la misma página del
    // manual — sin esto, todos tendrían el mismo aria-label y axe los marca
    // como landmarks indistinguibles (landmark-unique).
    label: string;
}) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    const scrollByCard = (direction: 1 | -1) => {
        const el = scrollerRef.current;
        if (!el) return;
        const card = el.querySelector<HTMLElement>('[data-subsection-card]');
        const amount = (card?.offsetWidth ?? 320) + 16;
        el.scrollBy({ left: direction * amount, behavior: 'smooth' });
    };

    return (
        <div className="relative my-6 print:contents">
            <div
                ref={scrollerRef}
                role="region"
                aria-label={`Subsecciones de ${label}, desplazamiento horizontal`}
                tabIndex={0}
                className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:mx-0 sm:px-0 print:contents"
            >
                {children}
            </div>
            <div className="mt-2 hidden justify-end gap-2 sm:flex print:hidden">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => scrollByCard(-1)}
                    aria-label="Subsección anterior"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => scrollByCard(1)}
                    aria-label="Subsección siguiente"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
