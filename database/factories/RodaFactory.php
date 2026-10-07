<?php

namespace Database\Factories;

use App\Models\Roda;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Roda>
 */
class RodaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'video_url' => 'https://www.youtube.com/watch?v='.fake()->regexify('[A-Za-z0-9_-]{11}'),
            'location' => null,
            'event_date' => fake()->date(),
            'participants' => null,
            'tags' => null,
            'views' => 0,
        ];
    }
}
