<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Invitado de un encuentro (mestres, profesores de otros grupos…). La foto
 * se guarda en la carpeta privada de subidas y la página pública la sirve
 * por `{base}/invitados/{id}/foto`.
 *
 * @property string $id
 * @property string $encuentro_id
 * @property string $nombre
 * @property string|null $titulo
 * @property string|null $grupo
 * @property string|null $ciudad
 * @property string|null $bio
 * @property string|null $foto_url
 * @property int $sort_order
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EncuentroInvitado extends Model
{
    use HasUuids;

    protected $table = 'encuentro_invitados';

    protected $fillable = ['encuentro_id', 'nombre', 'titulo', 'grupo', 'ciudad', 'bio', 'foto_url', 'sort_order'];

    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }
}
