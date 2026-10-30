import { ExternalLink, Map as MapIcon, MapPin } from 'lucide-react';
import { useState } from 'react';
import { PanelTitle } from '@/components/headings';
import { Button } from '@/components/ui/button';
import { mapaEmbedUrl, mapaLinkUrl } from '@/lib/encuentros';
import { useT } from '@/lib/i18n';

/**
 * Lugar del encuentro con mapa de Google. El mapa se carga solo cuando la
 * persona lo pide: así Google no recibe nada de quien no lo abre y la página
 * carga más liviana en el celular.
 */
export function MapaPublico({
    lugar,
    direccion,
    enlace,
}: {
    lugar: string | null;
    direccion: string | null;
    enlace: string | null;
}) {
    const { t } = useT();
    const [abierto, setAbierto] = useState(false);
    const comoLlegar = mapaLinkUrl(direccion, enlace);

    if (!direccion && !comoLlegar) {
        return null;
    }

    return (
        <section className="space-y-3">
            <PanelTitle icon={MapPin}>{t('lugar')}</PanelTitle>
            <div className="space-y-3 panel p-5">
                <div>
                    {lugar && (
                        <p className="font-medium text-foreground">{lugar}</p>
                    )}
                    {direccion && (
                        <p className="text-sm text-muted-foreground">
                            {direccion}
                        </p>
                    )}
                </div>
                {direccion &&
                    (abierto ? (
                        <iframe
                            title={t('mapa_de', { lugar: lugar ?? direccion })}
                            src={mapaEmbedUrl(direccion)}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="aspect-[4/3] w-full rounded-lg border border-border sm:aspect-[16/9]"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setAbierto(true)}
                            className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                        >
                            <MapIcon className="h-8 w-8" />
                            <span className="font-medium">{t('ver_mapa')}</span>
                            <span className="text-xs">
                                {t('ver_mapa_detalle')}
                            </span>
                        </button>
                    ))}
                {comoLlegar && (
                    <Button asChild variant="outline" className="gap-2">
                        <a
                            href={comoLlegar}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-4 w-4" />
                            {t('como_llegar')}
                        </a>
                    </Button>
                )}
            </div>
        </section>
    );
}
