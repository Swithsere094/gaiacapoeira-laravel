<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Visita a una página (analíticas propias). Solo tiene `created_at`.
 *
 * `created_at` lo pone siempre la aplicación (Eloquent) y no el default
 * CURRENT_TIMESTAMP de la columna: el huso horario de la sesión de MySQL
 * puede no ser UTC y correr el día de la visita (ver CLAUDE.md).
 *
 * @property string $id
 * @property string $path
 * @property string|null $user_id
 * @property Carbon $created_at
 */
class PageView extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = ['path', 'user_id'];
}
