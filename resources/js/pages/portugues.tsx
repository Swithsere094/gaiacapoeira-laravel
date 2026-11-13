import { router } from '@inertiajs/react';
import { BarChart3, Layers, Languages, List, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { PageTabs } from '@/components/page-tabs';
import { Flashcards } from '@/components/portugues/flashcards';
import type { Mazo } from '@/components/portugues/flashcards';
import { ListaPalabras } from '@/components/portugues/lista-palabras';
import { PalabraDialog } from '@/components/portugues/palabra-dialog';
import { Progreso, ResumenCifras } from '@/components/portugues/progreso';
import type { Resumen } from '@/components/portugues/progreso';
import { SesionHoy } from '@/components/portugues/sesion-hoy';
import { usePathname, useSearchParams } from '@/lib/navigation';
import {
    estadoDe,
    loteActual,
    loteDe,
    paraHoy,
    tieneAsociacion,
} from '@/lib/portugues';
import type { Palabra, PortuguesProps } from '@/types/portugues';

type Tab = 'hoy' | 'lista' | 'flashcards' | 'progreso';

const TABS: Tab[] = ['hoy', 'lista', 'flashcards', 'progreso'];

export default function PortuguesPage({
    palabras,
    tarjetas,
    lotesAvanzados,
    hoy,
    loteTamano,
}: PortuguesProps) {
    const pathname = usePathname();
    const pedida = useSearchParams().get('tab') as Tab | null;
    const [tab, setTab] = useState<Tab>(
        pedida && TABS.includes(pedida) ? pedida : 'hoy',
    );
    const totalLotes = loteDe(palabras.length, loteTamano);
    const lote = loteActual(totalLotes, lotesAvanzados);
    const [listaLote, setListaLote] = useState<number | null>(lote ?? 1);
    const [mazo, setMazo] = useState<Mazo>('hoy');
    const [editando, setEditando] = useState<Palabra | null>(null);

    const resumen: Resumen = useMemo(
        () => ({
            aprendidas: palabras.filter(
                (p) => estadoDe(tarjetas[p.id]) === 'aprendida',
            ).length,
            conAsociacion: palabras.filter((p) =>
                tieneAsociacion(tarjetas[p.id]),
            ).length,
            paraHoy: palabras.filter(
                (p) =>
                    paraHoy(tarjetas[p.id], hoy) &&
                    tieneAsociacion(tarjetas[p.id]),
            ).length,
            lote,
        }),
        [palabras, tarjetas, hoy, lote],
    );

    const irA = (nueva: Tab) => {
        setTab(nueva);
        router.replace({
            url: nueva === 'hoy' ? pathname : `${pathname}?tab=${nueva}`,
            preserveScroll: true,
            preserveState: true,
        });
    };

    const verLote = (n: number) => {
        setListaLote(n);
        irA('lista');
    };

    return (
        <PageLayout
            title="O caminho"
            header={
                <PageHeader
                    icon={Languages}
                    title="O caminho"
                    description="O caminho do pinto ao gaio"
                >
                    <ResumenCifras
                        resumen={resumen}
                        total={palabras.length}
                        totalLotes={totalLotes}
                    />
                </PageHeader>
            }
            tabs={
                <PageTabs
                    label="Secciones de O caminho"
                    tabs={[
                        {
                            key: 'hoy',
                            label: 'Hoy',
                            icon: Sparkles,
                            active: tab === 'hoy',
                            onClick: () => irA('hoy'),
                        },
                        {
                            key: 'lista',
                            label: 'Lista',
                            icon: List,
                            active: tab === 'lista',
                            onClick: () => irA('lista'),
                        },
                        {
                            key: 'flashcards',
                            label: 'Flashcards',
                            icon: Layers,
                            active: tab === 'flashcards',
                            onClick: () => irA('flashcards'),
                            badge: resumen.paraHoy,
                        },
                        {
                            key: 'progreso',
                            label: 'Progreso',
                            icon: BarChart3,
                            active: tab === 'progreso',
                            onClick: () => irA('progreso'),
                        },
                    ]}
                />
            }
        >
            {tab === 'hoy' && (
                <SesionHoy
                    palabras={palabras}
                    tarjetas={tarjetas}
                    lote={lote}
                    loteTamano={loteTamano}
                    onElegirOtras={verLote}
                    onRepasar={() => {
                        setMazo('hoy');
                        irA('flashcards');
                    }}
                />
            )}

            {tab === 'lista' && (
                <ListaPalabras
                    palabras={palabras}
                    tarjetas={tarjetas}
                    loteTamano={loteTamano}
                    totalLotes={totalLotes}
                    lote={listaLote}
                    onLoteChange={setListaLote}
                    onEditar={setEditando}
                />
            )}

            {tab === 'flashcards' && (
                <Flashcards
                    palabras={palabras}
                    tarjetas={tarjetas}
                    hoy={hoy}
                    loteTamano={loteTamano}
                    totalLotes={totalLotes}
                    mazoInicial={mazo}
                />
            )}

            {tab === 'progreso' && (
                <Progreso
                    palabras={palabras}
                    tarjetas={tarjetas}
                    loteTamano={loteTamano}
                    totalLotes={totalLotes}
                    lotesAvanzados={lotesAvanzados}
                    onVerLote={verLote}
                />
            )}

            <PalabraDialog
                palabra={editando}
                tarjeta={editando ? tarjetas[editando.id] : undefined}
                onClose={() => setEditando(null)}
            />
        </PageLayout>
    );
}
