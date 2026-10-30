import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PanelTitle } from '@/components/headings';
import { useT } from '@/lib/i18n';
import type { FotoPublica } from '@/types/encuentros';

/**
 * Galería de fotos de un encuentro terminado: miniaturas en grilla y, al
 * tocar una, la foto grande con anterior / siguiente (flechas del teclado,
 * Escape para cerrar).
 */
export function GaleriaPublica({ fotos }: { fotos: FotoPublica[] }) {
    const { t } = useT();
    const [abierta, setAbierta] = useState<number | null>(null);

    const mover = useCallback(
        (paso: number) =>
            setAbierta((i) =>
                i === null ? i : (i + paso + fotos.length) % fotos.length,
            ),
        [fotos.length],
    );

    useEffect(() => {
        if (abierta === null) {
            return;
        }
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAbierta(null);
            if (e.key === 'ArrowLeft') mover(-1);
            if (e.key === 'ArrowRight') mover(1);
        };
        document.addEventListener('keydown', onKey);
        // Sin desplazamiento de fondo mientras está abierta.
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [abierta, mover]);

    if (fotos.length === 0) {
        return null;
    }

    const actual = abierta === null ? null : fotos[abierta];

    return (
        <section className="space-y-3">
            <PanelTitle icon={Images}>{t('fotos')}</PanelTitle>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {fotos.map((f, i) => (
                    <li key={f.id}>
                        <button
                            type="button"
                            onClick={() => setAbierta(i)}
                            className="block aspect-square w-full overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            <img
                                src={f.miniatura}
                                alt={t('foto_n', {
                                    n: String(i + 1),
                                    total: String(fotos.length),
                                })}
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        </button>
                    </li>
                ))}
            </ul>

            {actual && abierta !== null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('foto_n', {
                        n: String(abierta + 1),
                        total: String(fotos.length),
                    })}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-6"
                    onClick={() => setAbierta(null)}
                >
                    <img
                        src={actual.foto}
                        alt=""
                        className="max-h-full max-w-full rounded object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <p className="absolute top-4 left-4 text-sm text-white/80">
                        {abierta + 1} / {fotos.length}
                    </p>
                    <BotonVisor
                        label={t('cerrar')}
                        className="top-3 right-3"
                        onClick={() => setAbierta(null)}
                    >
                        <X className="h-6 w-6" />
                    </BotonVisor>
                    {fotos.length > 1 && (
                        <>
                            <BotonVisor
                                label={t('anterior')}
                                className="top-1/2 left-2 -translate-y-1/2"
                                onClick={() => mover(-1)}
                            >
                                <ChevronLeft className="h-7 w-7" />
                            </BotonVisor>
                            <BotonVisor
                                label={t('siguiente')}
                                className="top-1/2 right-2 -translate-y-1/2"
                                onClick={() => mover(1)}
                            >
                                <ChevronRight className="h-7 w-7" />
                            </BotonVisor>
                        </>
                    )}
                </div>
            )}
        </section>
    );
}

function BotonVisor({
    label,
    className,
    onClick,
    children,
}: {
    label: string;
    className: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={`absolute flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/80 ${className}`}
        >
            {children}
        </button>
    );
}
