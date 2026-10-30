import { Calculator, Users } from 'lucide-react';
import { PageTabs } from '@/components/page-tabs';

/** Pestañas del panel de un encuentro: inscripciones y contabilidad. */
export function EncuentroTabs({
    encuentroId,
    activa,
}: {
    encuentroId: string;
    activa: 'inscripciones' | 'contabilidad';
}) {
    return (
        <PageTabs
            label="Secciones del encuentro"
            tabs={[
                {
                    key: 'inscripciones',
                    label: 'Inscripciones',
                    icon: Users,
                    href: `/encuentros/${encuentroId}`,
                    active: activa === 'inscripciones',
                },
                {
                    key: 'contabilidad',
                    label: 'Contabilidad',
                    icon: Calculator,
                    href: `/encuentros/${encuentroId}/contabilidad`,
                    active: activa === 'contabilidad',
                },
            ]}
        />
    );
}
