<?php

namespace Database\Factories;

use App\Models\Politica;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Politica>
 */
class PoliticaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'content' => fake()->paragraph(),
            'category' => 'Otro',
            'file_url' => null,
            'file_name' => null,
        ];
    }
}
