<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Una actividad de la programación de un encuentro (roda, taller,
 * batizado…). Las horas son de Colombia, sin conversiones; sin hora =
 * actividad del día sin horario fijo.
 *
 * @property string $id
 * @property string $encuentro_id
 * @property CarbonImmutable $fecha
 * @property string|null $hora_inicio HH:MM:SS
 * @property string|null $hora_fin HH:MM:SS
 * @property string $titulo
 * @property string|null $descripcion
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EncuentroActividad extends Model
{
    use HasUuids;

    protected $table = 'encuentro_actividades';

    protected $fillable = ['encuentro_id', 'fecha', 'hora_inicio', 'hora_fin', 'titulo', 'descripcion', 'sort_order'];

    protected function casts(): array
    {
        return [
            'fecha' => 'immutable_date:Y-m-d',
            'sort_order' => 'integer',
        ];
    }

    /** @return array{id: string, fecha: string, hora_inicio: string|null, hora_fin: string|null, titulo: string, descripcion: string|null} */
    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'fecha' => $this->fecha->toDateString(),
            // "14:30:00" → "14:30"
            'hora_inicio' => $this->hora_inicio ? substr($this->hora_inicio, 0, 5) : null,
            'hora_fin' => $this->hora_fin ? substr($this->hora_fin, 0, 5) : null,
            'titulo' => $this->titulo,
            'descripcion' => $this->descripcion,
        ];
    }
}
