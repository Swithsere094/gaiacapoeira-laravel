<?php

namespace App\Models;

use App\Support\Permissions;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Carbon;

/**
 * Usuario del sitio. Tabla heredada `usuarios` (no la `users` estándar de
 * Laravel): IDs UUID CHAR(36), login por `username` y la contraseña en
 * `password_hash`. Los hashes heredados son bcrypt `$2b$` (bcryptjs) y
 * `Hash::check` de Laravel los verifica sin conversión; al iniciar sesión
 * Laravel los re-hashea solo si cambia el costo configurado.
 *
 * El rol sale de `role_id` (relación `rol`, tabla `roles`; se llama `rol`
 * porque `role` fue una columna ENUM hasta la fase 9).
 *
 * @property string $id
 * @property string $username
 * @property string $password_hash
 * @property string $name
 * @property string|null $email
 * @property string $role_id
 * @property string|null $apodo
 * @property string|null $avatar
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Role|null $rol
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUuids;

    protected $table = 'usuarios';

    /** Columna donde Laravel lee y re-hashea la contraseña. */
    protected $authPasswordName = 'password_hash';

    /**
     * La tabla no tiene `remember_token`: el sitio nunca tuvo "recordarme".
     * Con el nombre vacío, Laravel no intenta leerlo ni escribirlo.
     */
    protected $rememberTokenName = '';

    protected $fillable = ['username', 'password_hash', 'name', 'email', 'role_id', 'apodo', 'avatar'];

    protected $hidden = ['password_hash'];

    /** El rol se usa en casi cada petición (permisos, navegación). */
    protected $with = ['rol'];

    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
        ];
    }

    /** @return BelongsTo<Role, $this> */
    public function rol(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function isAdmin(): bool
    {
        return $this->rol?->isAdmin() ?? false;
    }

    /** El admin tiene todos; el resto, los de su rol. */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    /** @return list<string> */
    public function permissions(): array
    {
        if ($this->isAdmin()) {
            return Permissions::ALL;
        }

        return array_values($this->rol?->permissions->map(fn (Permission $p) => $p->slug)->all() ?? []);
    }

    /**
     * Campos públicos (misma forma que `AppUser` del sitio original): el rol
     * va como `role` (su slug) y `role_name` (su nombre visible).
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            ...$this->only(['id', 'username', 'name', 'email']),
            'role' => $this->rol->slug ?? Role::MEMBER,
            'role_name' => $this->rol->name ?? 'Miembro',
            ...$this->only(['apodo', 'avatar']),
        ];
    }
}
