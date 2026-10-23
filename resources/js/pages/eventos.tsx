import { router } from '@inertiajs/react';
import { CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog';
import { CalendarNav } from '@/components/eventos/calendar-nav';
import { EventDetailDialog } from '@/components/eventos/event-detail-dialog';
import { EventFormDialog } from '@/components/eventos/event-form-dialog';
import { MonthView } from '@/components/eventos/month-view';
import { WeekView } from '@/components/eventos/week-view';
import { PageHeader } from '@/components/page-header';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import type { CalendarData, CalendarEvent } from '@/lib/calendar';
import { cn } from '@/lib/utils';

const VIEWS = [
    { id: 'mes', label: 'Mes' },
    { id: 'semana', label: 'Semana' },
] as const;

export default function EventosPage({ calendar }: { calendar: CalendarData }) {
    const { can } = useAuth();
    const { confirm, notify } = useConfirm();
    const canCreate = can('eventos.gestionar');

    const [selected, setSelected] = useState<{
        event: CalendarEvent;
        date: string;
    } | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    // Cambia en cada apertura: el formulario empieza de cero.
    const [formKey, setFormKey] = useState(0);
    const [editing, setEditing] = useState<CalendarEvent | null>(null);

    const openForm = (event: CalendarEvent | null) => {
        setSelected(null);
        setEditing(event);
        setFormKey((k) => k + 1);
        setFormOpen(true);
    };

    const changeView = (vista: 'mes' | 'semana') =>
        router.get(
            '/eventos',
            { vista, fecha: calendar.date },
            { only: ['calendar'], preserveScroll: true, preserveState: true },
        );

    const handleDelete = async (event: CalendarEvent) => {
        const ok = await confirm({
            title: `¿Eliminar el evento "${event.title}"?`,
            description: event.repeat_days
                ? 'Se eliminan todas sus repeticiones. Esta acción no se puede deshacer.'
                : 'Esta acción no se puede deshacer.',
            confirmLabel: 'Eliminar',
            destructive: true,
        });

        if (!ok) {
            return;
        }

        setSelected(null);
        router.delete(`/eventos/${event.id}`, {
            preserveScroll: true,
            onError: () =>
                void notify({ title: 'No se pudo eliminar el evento.' }),
        });
    };

    // Al crear, la fecha propuesta es hoy si se está viendo; si no, el
    // primer día del período visible.
    const defaultDate =
        calendar.today >= calendar.from && calendar.today <= calendar.to
            ? calendar.today
            : calendar.view === 'mes'
              ? calendar.date.slice(0, 8) + '01'
              : calendar.from;

    const onSelectEvent = (event: CalendarEvent, date: string) =>
        setSelected({ event, date });

    return (
        <PageLayout
            title="Eventos"
            header={
                <PageHeader
                    icon={CalendarDays}
                    title="Eventos"
                    description="Clases, rodas y encuentros del grupo (hora de Colombia)"
                    actions={
                        canCreate && (
                            <Button
                                onClick={() => openForm(null)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo evento
                            </Button>
                        )
                    }
                />
            }
        >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CalendarNav
                    calendar={calendar}
                    url="/eventos"
                    params={{ vista: calendar.view }}
                />
                <div
                    className="inline-flex rounded-lg bg-secondary p-1"
                    role="group"
                    aria-label="Vista del calendario"
                >
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            type="button"
                            onClick={() => changeView(v.id)}
                            aria-pressed={calendar.view === v.id}
                            className={cn(
                                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                                calendar.view === v.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {calendar.view === 'mes' ? (
                <MonthView calendar={calendar} onSelectEvent={onSelectEvent} />
            ) : (
                <WeekView calendar={calendar} onSelectEvent={onSelectEvent} />
            )}

            <EventDetailDialog
                event={selected?.event ?? null}
                date={selected?.date ?? null}
                onClose={() => setSelected(null)}
                onEdit={openForm}
                onDelete={handleDelete}
            />

            {canCreate && (
                <EventFormDialog
                    key={formKey}
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    editing={editing}
                    defaultDate={defaultDate}
                />
            )}
        </PageLayout>
    );
}
