<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Reto con su entrenamiento guiado (`steps`):
 *  - práctica: de una habilidad, se hace por semanas y da medallas;
 *  - secreto: uno por habilidad, aparece tras `secret_weeks` semanas
 *    válidas; se repite libremente y lleva a pedir revisión;
 *  - suelto: sin habilidad (flexibilidad, fortalecimiento...), por semanas
 *    y con medallas, sin efecto en el árbol.
 *
 * @property string $id
 * @property string|null $habilidad_id
 * @property string $kind
 * @property string|null $category
 * @property string $title
 * @property string|null $description
 * @property list<array{title: string, detail: string, seconds: int}> $steps
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Habilidad|null $habilidad
 */
class Reto extends Model
{
    use HasUuids;

    public const PRACTICA = 'practica';

    public const SECRETO = 'secreto';

    public const SUELTO = 'suelto';

    public const KINDS = [self::PRACTICA, self::SECRETO, self::SUELTO];

    /** Categorías de los retos sueltos. */
    public const CATEGORIES = ['flexibilidad', 'fortalecimiento', 'resistencia', 'movilidad', 'musicalidad'];

    protected $table = 'retos';

    protected $fillable = ['habilidad_id', 'kind', 'category', 'title', 'description', 'steps', 'sort_order'];

    protected function casts(): array
    {
        return [
            'steps' => 'array',
        ];
    }

    /** @return BelongsTo<Habilidad, $this> */
    public function habilidad(): BelongsTo
    {
        return $this->belongsTo(Habilidad::class);
    }

    /** Se hace por semanas (práctica y sueltos); el secreto, no. */
    public function isWeekly(): bool
    {
        return $this->kind !== self::SECRETO;
    }

    /** Duración total del entrenamiento guiado, en segundos. */
    public function totalSeconds(): int
    {
        return (int) array_sum(array_column($this->steps, 'seconds'));
    }
}
