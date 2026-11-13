<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Una de las 1000 palabras más usadas del portugués de Brasil
 * (database/data/portugues-palabras.php). `posicion` = orden de frecuencia
 * (1 = la más usada); el lote sale de ahí (ver `lote()`).
 *
 * @property string $id
 * @property int $posicion
 * @property string $palabra
 * @property string $traduccion
 * @property string $tipo
 * @property list<string> $formas
 * @property string|null $ejemplo
 * @property string|null $ejemplo_traduccion
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PortuguesPalabra extends Model
{
    use HasUuids;

    /** Palabras por lote. */
    public const LOTE = 20;

    public const TIPOS = ['verbo', 'sustantivo', 'adjetivo', 'pronombre', 'adverbio', 'conector', 'numero', 'expresion'];

    protected $table = 'portugues_palabras';

    protected $fillable = ['posicion', 'palabra', 'traduccion', 'tipo', 'formas', 'ejemplo', 'ejemplo_traduccion'];

    protected function casts(): array
    {
        return ['formas' => 'array', 'posicion' => 'integer'];
    }

    /** @return HasMany<PortuguesTarjeta, $this> */
    public function tarjetas(): HasMany
    {
        return $this->hasMany(PortuguesTarjeta::class, 'palabra_id');
    }

    public static function loteDe(int $posicion): int
    {
        return intdiv($posicion - 1, self::LOTE) + 1;
    }

    public function lote(): int
    {
        return self::loteDe($this->posicion);
    }
}
