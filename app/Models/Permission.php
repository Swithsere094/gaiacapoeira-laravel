<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Permiso del catálogo (ver App\Support\Permissions). Las filas las crean
 * las migraciones, no la pantalla de roles.
 *
 * @property string $id
 * @property string $slug
 * @property string $name
 * @property string|null $description
 */
class Permission extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = ['slug', 'name', 'description'];
}
