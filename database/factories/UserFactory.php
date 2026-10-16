<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            // El cast 'hashed' del modelo lo convierte a bcrypt al guardar.
            'password_hash' => 'password',
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'role_id' => fn () => Role::idFor(Role::MEMBER),
            'apodo' => null,
            'avatar' => null,
        ];
    }

    public function admin(): static
    {
        return $this->withRole(Role::ADMIN);
    }

    /** Con el rol de ese slug (los roles base los crea la migración). */
    public function withRole(string $slug): static
    {
        return $this->state(fn () => ['role_id' => Role::idFor($slug)]);
    }
}
