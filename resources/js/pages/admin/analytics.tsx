import { BarChart3, Eye, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { PanelTitle } from '@/components/headings';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { formatDate } from '@/lib/dates';

interface Summary {
    totalViews: number;
    uniqueUsers: number;
    topPages: { path: string; count: number }[];
    viewsByDay: { day: string; count: number }[];
}

const chartConfig = {
    count: { label: 'Visitas', color: 'var(--primary)' },
} satisfies ChartConfig;

// Solo admin: la ruta ya la protege el servidor (middleware `admin`), y el
// resumen llega calculado como prop de Inertia.
export default function AdminAnalyticsPage({ summary }: { summary: Summary }) {
    return (
        <PageLayout
            title="Analíticas"
            width="medium"
            header={
                <PageHeader
                    icon={BarChart3}
                    title="Analíticas"
                    description="Visitas propias del sitio — sin servicios externos."
                />
            }
        >
            {summary && (
                <div className="space-y-6">
                    {/* Totales */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center gap-4 panel p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                <Eye className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {summary.totalViews}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Visitas totales
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 panel p-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">
                                    {summary.uniqueUsers}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Usuarios distintos
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Visitas por día */}
                    <div className="panel p-6">
                        <PanelTitle className="mb-4">
                            Últimos 30 días
                        </PanelTitle>
                        <ChartContainer
                            config={chartConfig}
                            className="h-64 w-full"
                        >
                            <BarChart data={summary.viewsByDay}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(value: string) =>
                                        formatDate(value, 'short')
                                    }
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="var(--color-count)"
                                    radius={4}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>

                    {/* Páginas más visitadas */}
                    <div className="panel p-6">
                        <PanelTitle className="mb-4">
                            Páginas más visitadas
                        </PanelTitle>
                        {summary.topPages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Todavía no hay visitas registradas.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {summary.topPages.map((p) => (
                                    <div
                                        key={p.path}
                                        className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0"
                                    >
                                        <span className="truncate font-mono text-sm text-foreground">
                                            {p.path}
                                        </span>
                                        <span className="shrink-0 text-sm text-muted-foreground">
                                            {p.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
