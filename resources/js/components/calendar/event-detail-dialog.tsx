import {
    CalendarDays,
    Clock,
    MapPin,
    Pencil,
    Trash2,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { CalendarEvent } from '@/lib/calendar';
import { longDate, scheduleText, timeRange } from '@/lib/calendar';

/**
 * Detalle de un evento. Editar y eliminar aparecen solo si se pasan las
 * acciones y la persona puede (`can_edit`, el servidor lo vuelve a revisar).
 */
export function EventDetailDialog({
    event,
    date,
    onClose,
    onEdit,
    onDelete,
}: {
    event: CalendarEvent | null;
    date: string | null;
    onClose: () => void;
    onEdit?: (event: CalendarEvent) => void;
    onDelete?: (event: CalendarEvent) => void;
}) {
    const canEdit = !!event?.can_edit && !!onEdit && !!onDelete;

    return (
        <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                {event && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="pr-6 font-serif text-xl break-words">
                                {event.title}
                            </DialogTitle>
                            {date && (
                                <DialogDescription>
                                    {longDate(date)}
                                </DialogDescription>
                            )}
                        </DialogHeader>

                        <dl className="space-y-3 text-sm">
                            <div className="flex gap-3">
                                <dt className="sr-only">Hora</dt>
                                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <dd>
                                    {timeRange(event)}
                                    {event.start_time && (
                                        <span className="text-muted-foreground">
                                            {' '}
                                            (hora de Colombia)
                                        </span>
                                    )}
                                </dd>
                            </div>
                            <div className="flex gap-3">
                                <dt className="sr-only">Fechas</dt>
                                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <dd>{scheduleText(event)}</dd>
                            </div>
                            {event.location && (
                                <div className="flex gap-3">
                                    <dt className="sr-only">Lugar</dt>
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <dd className="break-words">
                                        {event.location}
                                    </dd>
                                </div>
                            )}
                            {event.author && (
                                <div className="flex gap-3">
                                    <dt className="sr-only">Creado por</dt>
                                    <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <dd>Creado por {event.author}</dd>
                                </div>
                            )}
                        </dl>

                        {event.description && (
                            <p className="mt-2 text-sm break-words whitespace-pre-line text-muted-foreground">
                                {event.description}
                            </p>
                        )}

                        {canEdit && (
                            <div className="mt-4 flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => onDelete(event)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => onEdit(event)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
