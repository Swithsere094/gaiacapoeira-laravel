<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Rol del sitio. Cada persona tiene uno (`usuarios.role_id`) y cada rol, sus
 * permisos (`permission_role`). Los roles base `admin` y `member` no se
 * pueden eliminar; `admin` además tiene todos los permisos siempre y no se
 * edita.
 *
 * @property string $id
 * @property string $slug
 * @property string $name
 * @property string|null $description
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, Permission> $permissions
 */
class Role extends Model
{
    use HasUuids;

    public const ADMIN = 'admin';

    public const MEMBER = 'member';

    protected $fillable = ['slug', 'name', 'description'];

    /** @return BelongsToMany<Permission, $this> */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function isAdmin(): bool
    {
        return $this->slug === self::ADMIN;
    }

    public function isBase(): bool
    {
        return in_array($this->slug, [self::ADMIN, self::MEMBER], true);
    }

    public static function idFor(string $slug): string
    {
        return static::where('slug', $slug)->valueOrFail('id');
    }
}
