<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Pedido de revisión del reto secreto de una habilidad. Si se aprueba, la
 * habilidad queda dominada; si se rechaza (con comentario), se puede volver
 * a pedir de inmediato.
 *
 * @property string $id
 * @property string $user_id
 * @property string $habilidad_id
 * @property string $status pendiente | aprobada | rechazada
 * @property string|null $comment
 * @property string|null $reviewer_id
 * @property CarbonImmutable|null $reviewed_at
 * @property CarbonImmutable|null $celebrated_at cuándo se mostró la celebración de la aprobación
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User $user
 * @property-read Habilidad $habilidad
 * @property-read User|null $reviewer
 */
class Revision extends Model
{
    use HasUuids;

    public const PENDIENTE = 'pendiente';

    public const APROBADA = 'aprobada';

    public const RECHAZADA = 'rechazada';

    protected $table = 'revisiones';

    protected $fillable = ['user_id', 'habilidad_id', 'status', 'comment', 'reviewer_id', 'reviewed_at', 'celebrated_at'];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'immutable_datetime',
            'celebrated_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Habilidad, $this> */
    public function habilidad(): BelongsTo
    {
        return $this->belongsTo(Habilidad::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
