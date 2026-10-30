<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Una opción de precio de un encuentro ("Anticipado 3 días con camiseta",
 * "Solo sábado", "Grupo de 5"…). Las arma el organizador libremente.
 *
 * @property string $id
 * @property string $encuentro_id
 * @property string $nombre
 * @property string|null $descripcion
 * @property int $valor Pesos colombianos.
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EncuentroPrecio extends Model
{
    use HasUuids;

    protected $table = 'encuentro_precios';

    protected $fillable = ['encuentro_id', 'nombre', 'descripcion', 'valor', 'sort_order'];

    protected function casts(): array
    {
        return [
            'valor' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Encuentro, $this> */
    public function encuentro(): BelongsTo
    {
        return $this->belongsTo(Encuentro::class);
    }
}
