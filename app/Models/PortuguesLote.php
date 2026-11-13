<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Un lote de 20 palabras que una persona marcó como avanzado. El lote en el
 * que va es el primero que no marcó.
 *
 * @property string $id
 * @property string $user_id
 * @property int $lote
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PortuguesLote extends Model
{
    use HasUuids;

    protected $table = 'portugues_lotes';

    protected $fillable = ['user_id', 'lote'];

    protected function casts(): array
    {
        return ['lote' => 'integer'];
    }
}
