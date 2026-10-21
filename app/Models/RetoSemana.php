<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Una semana de un reto (práctica o suelto): 7 días desde que se acepta.
 * Cuenta un día por cada fecha con al menos un entrenamiento completado.
 * La medalla no se guarda: al terminar la semana sale de esos días
 * (4 bronce, 5 plata, 6-7 oro; 3 o menos, la semana no vale).
 *
 * @property string $id
 * @property string $user_id
 * @property string $reto_id
 * @property CarbonImmutable $starts_on
 * @property CarbonImmutable $ends_on
 * @property CarbonImmutable|null $abandoned_at
 * @property CarbonImmutable|null $celebrated_at cuándo se mostró la celebración de su medalla
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Reto $reto
 * @property-read User $user
 * @property-read Collection<int, Entrenamiento> $entrenamientos
 */
class RetoSemana extends Model
{
    use HasUuids;

    public const DAYS = 7;

    public const BRONCE = 'bronce';

    public const PLATA = 'plata';

    public const ORO = 'oro';

    /** Días mínimos para cada medalla (de mayor a menor). */
    public const MEDALS = [self::ORO => 6, self::PLATA => 5, self::BRONCE => 4];

    protected $table = 'reto_semanas';

    protected $fillable = ['user_id', 'reto_id', 'starts_on', 'ends_on', 'abandoned_at', 'celebrated_at'];

    protected function casts(): array
    {
        return [
            'starts_on' => 'immutable_date:Y-m-d',
            'ends_on' => 'immutable_date:Y-m-d',
            'abandoned_at' => 'immutable_datetime',
            'celebrated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Reto, $this> */
    public function reto(): BelongsTo
    {
        return $this->belongsTo(Reto::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Entrenamiento, $this> */
    public function entrenamientos(): HasMany
    {
        return $this->hasMany(Entrenamiento::class);
    }

    /** Medalla que corresponde a esa cantidad de días (null: no vale). */
    public static function medalForDays(int $days): ?string
    {
        foreach (self::MEDALS as $medal => $min) {
            if ($days >= $min) {
                return $medal;
            }
        }

        return null;
    }

    /** Días distintos con al menos un entrenamiento completado. */
    public function daysDone(): int
    {
        return $this->entrenamientos
            ->map(fn (Entrenamiento $e) => $e->completed_on?->toDateString())
            ->filter()
            ->unique()
            ->count();
    }

    public function isActive(CarbonImmutable $today): bool
    {
        return $this->abandoned_at === null && $today->lte($this->ends_on);
    }

    public function isFinished(CarbonImmutable $today): bool
    {
        return $this->abandoned_at === null && $today->gt($this->ends_on);
    }

    /** Medalla ganada (solo con la semana terminada). */
    public function medal(CarbonImmutable $today): ?string
    {
        return $this->isFinished($today) ? self::medalForDays($this->daysDone()) : null;
    }
}
