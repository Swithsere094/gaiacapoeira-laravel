import { Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import type { PageWidth } from '@/components/page-layout';
import { RetosTabs } from '@/components/retos/retos-tabs';

/** Estructura de las páginas de retos: encabezado con trofeo y pestañas. */
export function RetosLayout({
    title,
    description,
    pendingReviews,
    width = 'wide',
    className,
    children,
}: {
    title: string;
    description?: ReactNode;
    pendingReviews: number;
    width?: PageWidth;
    /** Clases extra para el contenido (ej. el espacio entre bloques). */
    className?: string;
    children: ReactNode;
}) {
    return (
        <PageLayout
            title={title}
            width={width}
            header={
                <PageHeader
                    icon={Trophy}
                    title={title}
                    description={description}
                />
            }
            tabs={<RetosTabs pendingReviews={pendingReviews} />}
            className={className}
        >
            {children}
        </PageLayout>
    );
}
