<?php

namespace Database\Factories;

use App\Models\Cantoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cantoria>
 */
class CantoriaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'video_url' => 'https://www.youtube.com/watch?v='.fake()->regexify('[A-Za-z0-9_-]{11}'),
            'description' => fake()->sentence(),
            'event_date' => fake()->date(),
        ];
    }
}
