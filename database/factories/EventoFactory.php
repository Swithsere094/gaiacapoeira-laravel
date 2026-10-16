<?php

namespace Database\Factories;

use App\Models\Evento;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evento>
 */
class EventoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => null,
            'location' => null,
            'starts_on' => '2026-11-10',
            'ends_on' => null,
            'start_time' => null,
            'end_time' => null,
            'repeat_days' => null,
            'user_id' => null,
        ];
    }
}
