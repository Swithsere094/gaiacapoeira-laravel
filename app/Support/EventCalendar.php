<?php

namespace App\Support;

use App\Models\Evento;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * Arma lo que muestra un calendario (inicio y /eventos): el rango visible,
 * los eventos que caen en él y sus repeticiones día por día.
 *
 * Todo en hora de Colombia: "hoy" se calcula allá y las fechas guardadas
 * se usan tal cual (sin conversiones).
 */
final class EventCalendar
{
    public const TIMEZONE = 'America/Bogota';

    public const VIEWS = ['mes', 'semana'];

    /** Hoy en Colombia, como fecha. */
    public static function today(): CarbonImmutable
    {
        return CarbonImmutable::parse(CarbonImmutable::now(self::TIMEZONE)->toDateString());
    }

    /**
     * Vista de mes: semanas completas (lunes a domingo) que cubren el mes de
     * `$date`. Vista de semana: lunes a domingo de la semana de `$date`.
     * Una fecha inválida o ausente se toma como hoy.
     *
     * @return array<string, mixed>
     */
    public static function build(string $view, ?string $date, ?User $user): array
    {
        $view = in_array($view, self::VIEWS, true) ? $view : 'mes';
        $anchor = self::parseDate($date) ?? self::today();

        if ($view === 'mes') {
            $from = $anchor->startOfMonth()->startOfWeek(CarbonInterface::MONDAY);
            $to = $anchor->endOfMonth()->endOfWeek(CarbonInterface::SUNDAY)->startOfDay();
        } else {
            $from = $anchor->startOfWeek(CarbonInterface::MONDAY);
            $to = $from->addDays(6);
        }

        $events = [];
        $occurrences = [];

        $query = Evento::with('user:id,name,apodo')
            ->where('starts_on', '<=', $to->toDateString())
            ->where(fn (Builder $q) => $q
                ->where('ends_on', '>=', $from->toDateString())
                ->orWhere(fn (Builder $q) => $q->whereNull('ends_on')->where('starts_on', '>=', $from->toDateString()))
            );

        foreach ($query->get() as $evento) {
            $dates = $evento->occurrencesBetween($from, $to);
            if ($dates === []) {
                continue;
            }

            $events[] = self::eventData($evento, $user);
            foreach ($dates as $d) {
                $occurrences[] = ['date' => $d, 'event_id' => $evento->id, 'sort' => $evento->start_time ?? ''];
            }
        }

        // Por día; dentro del día, primero los de todo el día y después por hora.
        usort($occurrences, fn (array $a, array $b) => [$a['date'], $a['sort']] <=> [$b['date'], $b['sort']]);

        return [
            'view' => $view,
            'date' => $anchor->toDateString(),
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'today' => self::today()->toDateString(),
            'events' => $events,
            'occurrences' => array_map(fn (array $o) => ['date' => $o['date'], 'event_id' => $o['event_id']], $occurrences),
        ];
    }

    /** @return array<string, mixed> */
    private static function eventData(Evento $evento, ?User $user): array
    {
        return [
            'id' => $evento->id,
            'title' => $evento->title,
            'description' => $evento->description,
            'location' => $evento->location,
            'starts_on' => $evento->starts_on->toDateString(),
            'ends_on' => $evento->ends_on?->toDateString(),
            'start_time' => $evento->start_time ? substr($evento->start_time, 0, 5) : null,
            'end_time' => $evento->end_time ? substr($evento->end_time, 0, 5) : null,
            'repeat_days' => $evento->repeat_days,
            'author' => $evento->user ? ($evento->user->apodo ?: $evento->user->name) : null,
            'can_edit' => (bool) $user?->can('update', $evento),
        ];
    }

    private static function parseDate(?string $date): ?CarbonImmutable
    {
        if (! is_string($date) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return null;
        }

        $parsed = CarbonImmutable::createFromFormat('!Y-m-d', $date);

        // Rango razonable (y descarta fechas como 2026-02-31).
        if (! $parsed || $parsed->toDateString() !== $date || $parsed->year < 2000 || $parsed->year > 2100) {
            return null;
        }

        return $parsed;
    }
}
