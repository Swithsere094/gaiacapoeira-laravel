<?php

namespace Database\Factories;

use App\Models\Song;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Song>
 */
class SongFactory extends Factory
{
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'type' => fake()->randomElement(Song::TYPES),
            'lyrics' => fake()->paragraph(),
            'translation' => null,
            'context' => null,
            'video_url' => null,
            'mestre' => null,
            'tags' => null,
            'nossa' => false,
        ];
    }
}
