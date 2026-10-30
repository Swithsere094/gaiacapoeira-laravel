<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Foto de la galería de un encuentro (recuerdo). Se guarda reducida y con
 * miniatura en la carpeta privada de subidas; la página pública las sirve
 * por `{base}/fotos/{id}` y `{base}/fotos/{id}/mini`.
 *
 * @property string $id
 * @property string $encuentro_id
 * @property string $foto_url
 * @property string $miniatura_url
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EncuentroFoto extends Model
{
    use HasUuids;

    protected $table = 'encuentro_fotos';

    protected $fillable = ['encuentro_id', 'foto_url', 'miniatura_url', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }
}
