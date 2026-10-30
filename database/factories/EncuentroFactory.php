<?php

namespace Database\Factories;

use App\Models\Encuentro;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Encuentro>
 */
class EncuentroFactory extends Factory
{
    public function definition(): array
    {
        return [
            'slug' => 'batizado-'.fake()->unique()->numberBetween(1000, 9999),
            'nombre' => 'Batizado '.fake()->year(),
            'starts_on' => '2027-07-02',
            'ends_on' => '2027-07-04',
            'lugar' => 'Rionegro',
            'estado' => Encuentro::BORRADOR,
        ];
    }

    public function publicado(): static
    {
        return $this->state(['estado' => Encuentro::PUBLICADO, 'subdominio' => 'creado']);
    }

    /** Con una opción de precio ("Tres días", $150.000). */
    public function conPrecio(int $valor = 150000): static
    {
        return $this->afterCreating(fn (Encuentro $e) => $e->precios()->create([
            'nombre' => 'Tres días',
            'valor' => $valor,
            'sort_order' => 0,
        ]));
    }
}
