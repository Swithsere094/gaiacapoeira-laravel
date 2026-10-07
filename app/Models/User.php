<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Carbon;

/**
 * Usuario del sitio. Tabla heredada `usuarios` (no la `users` estándar de
 * Laravel): IDs UUID CHAR(36), login por `username` y la contraseña en
 * `password_hash`. Los hashes heredados son bcrypt `$2b$` (bcryptjs) y
 * `Hash::check` de Laravel los verifica sin conversión; al iniciar sesión
 * Laravel los re-hashea solo si cambia el costo configurado.
 *
 * @property string $id
 * @property string $username
 * @property string $password_hash
 * @property string $name
 * @property string|null $email
 * @property 'admin'|'member' $role
 * @property string|null $apodo
 * @property string|null $avatar
 * @property Carbon $created_at
 * @property Carbon $updated_at
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

    protected $fillable = ['username', 'password_hash', 'name', 'email', 'role', 'apodo', 'avatar'];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'password_hash' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
