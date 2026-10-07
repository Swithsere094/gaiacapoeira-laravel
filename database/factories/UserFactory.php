<?php

namespace Database\Factories;

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
            'role' => 'member',
            'apodo' => null,
            'avatar' => null,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }
}
