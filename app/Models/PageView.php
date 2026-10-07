<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Visita a una página (analíticas propias). Solo tiene `created_at`.
 *
 * `created_at` lo pone siempre la aplicación (Eloquent) y no el default
 * CURRENT_TIMESTAMP de la columna: el huso horario de la sesión de MySQL
 * puede no ser UTC y correr el día de la visita (ver CLAUDE.md).
 */
class PageView extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $fillable = ['path', 'user_id'];
}
