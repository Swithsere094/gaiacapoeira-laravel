<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Habilidad (nodo) de uno de los dos árboles. Se desbloquea cuando se
 * dominan todos sus requisitos (App\Support\Progreso).
 *
 * @property string $id
 * @property string $tree movimiento | musicalidad
 * @property string $slug
 * @property string $name
 * @property string|null $description
 * @property string|null $video_url
 * @property int $secret_weeks semanas válidas para que aparezca el reto secreto
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, Habilidad> $requisitos
 * @property-read Collection<int, Reto> $retos
 */
class Habilidad extends Model
{
    use HasUuids;

    public const MOVIMIENTO = 'movimiento';

    public const MUSICALIDAD = 'musicalidad';

    public const TREES = [self::MOVIMIENTO, self::MUSICALIDAD];

    protected $table = 'habilidades';

    protected $fillable = ['tree', 'slug', 'name', 'description', 'video_url', 'secret_weeks', 'sort_order'];

    /**
     * Habilidades que hay que dominar (todas) para desbloquear esta.
     *
     * @return BelongsToMany<Habilidad, $this>
     */
    public function requisitos(): BelongsToMany
    {
        return $this->belongsToMany(Habilidad::class, 'habilidad_requisitos', 'habilidad_id', 'requisito_id');
    }

    /** @return HasMany<Reto, $this> */
    public function retos(): HasMany
    {
        return $this->hasMany(Reto::class)->orderBy('sort_order');
    }
}
