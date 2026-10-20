<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Una sesión del entrenamiento guiado de un reto. Se crea al iniciar
 * (`started_at` y `duration_seconds` del reto en ese momento) y se completa
 * al terminar el cronómetro (`completed_at`, y `completed_on`: el día en
 * hora de Colombia). Las de la semana de un reto llevan `reto_semana_id`;
 * las del reto secreto, no.
 *
 * @property string $id
 * @property string $user_id
 * @property string $reto_id
 * @property string|null $reto_semana_id
 * @property int $duration_seconds
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable|null $completed_at
 * @property CarbonImmutable|null $completed_on
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Reto $reto
 * @property-read RetoSemana|null $semana
 */
class Entrenamiento extends Model
{
    use HasUuids;

    protected $table = 'entrenamientos';

    protected $fillable = ['user_id', 'reto_id', 'reto_semana_id', 'duration_seconds', 'started_at', 'completed_at', 'completed_on'];

    protected function casts(): array
    {
        return [
            'started_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
            'completed_on' => 'immutable_date:Y-m-d',
        ];
    }

    /** @return BelongsTo<Reto, $this> */
    public function reto(): BelongsTo
    {
        return $this->belongsTo(Reto::class);
    }

    /** @return BelongsTo<RetoSemana, $this> */
    public function semana(): BelongsTo
    {
        return $this->belongsTo(RetoSemana::class, 'reto_semana_id');
    }
}
