<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\EventoFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Evento del calendario. Fechas y horas en hora de Colombia, tal cual (ver
 * la migración create_eventos_table).
 *
 *  - de un día: solo `starts_on`;
 *  - de varios días seguidos: `starts_on` → `ends_on`, sin `repeat_days`;
 *  - recurrente: `repeat_days` (ISO: 1 = lunes … 7 = domingo) entre
 *    `starts_on` y `ends_on` (obligatoria).
 *
 * Sin `start_time` es de todo el día. Las horas valen para cada día.
 *
 * @property string $id
 * @property string $title
 * @property string|null $description
 * @property string|null $location
 * @property CarbonImmutable $starts_on
 * @property CarbonImmutable|null $ends_on
 * @property string|null $start_time HH:MM:SS
 * @property string|null $end_time HH:MM:SS
 * @property list<int>|null $repeat_days
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User|null $user
 */
class Evento extends Model
{
    /** @use HasFactory<EventoFactory> */
    use HasFactory, HasUuids;

    protected $table = 'eventos';

    protected $fillable = [
        'title', 'description', 'location', 'starts_on', 'ends_on',
        'start_time', 'end_time', 'repeat_days', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'immutable_date:Y-m-d',
            'ends_on' => 'immutable_date:Y-m-d',
            'repeat_days' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Último día del evento (el mismo de inicio si es de un día). */
    public function lastDay(): CarbonImmutable
    {
        return $this->ends_on ?? $this->starts_on;
    }

    /**
     * Días en que ocurre el evento dentro de [$from, $to] (ambos incluidos).
     *
     * @return list<string> fechas Y-m-d
     */
    public function occurrencesBetween(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $day = $this->starts_on->max($from->startOfDay());
        $last = $this->lastDay()->min($to->startOfDay());
        $repeat = $this->repeat_days ?: null;
        $dates = [];

        for (; $day->lte($last); $day = $day->addDay()) {
            if ($repeat === null || in_array($day->dayOfWeekIso, $repeat, true)) {
                $dates[] = $day->toDateString();
            }
        }

        return $dates;
    }
}
