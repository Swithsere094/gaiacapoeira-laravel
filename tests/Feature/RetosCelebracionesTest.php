<?php

namespace Tests\Feature;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\Revision;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Celebraciones de logros y avance por árbol (mejoras visuales del demo). */
class RetosCelebracionesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-20 20:00:00', 'UTC'));
    }

    private function skill(string $slug): Habilidad
    {
        return Habilidad::where('slug', $slug)->firstOrFail();
    }

    private function practica(string $slug): Reto
    {
        return $this->skill($slug)->retos()->where('kind', Reto::PRACTICA)->firstOrFail();
    }

    /** @param list<int> $days días con entrenamiento (0 = primero) */
    private function week(User $user, Reto $reto, string $startsOn, array $days): RetoSemana
    {
        $start = CarbonImmutable::parse($startsOn);
        $week = RetoSemana::create([
            'user_id' => $user->id, 'reto_id' => $reto->id,
            'starts_on' => $start, 'ends_on' => $start->addDays(6),
        ]);
        foreach ($days as $d) {
            Entrenamiento::create([
                'user_id' => $user->id, 'reto_id' => $reto->id, 'reto_semana_id' => $week->id,
                'duration_seconds' => 60, 'started_at' => $start->addDays($d),
                'completed_at' => $start->addDays($d), 'completed_on' => $start->addDays($d),
            ]);
        }

        return $week;
    }

    /** @return list<array<string, mixed>> */
    private function celebrations(string $url): array
    {
        $props = $this->get($url)->assertOk()->viewData('page')['props'];

        return $url === '/' ? $props['retos']['celebrations'] : $props['celebrations'];
    }

    public function test_una_medalla_se_celebra_una_sola_vez(): void
    {
        $user = $this->actingAsRole('admin');
        $this->week($user, $this->practica('ginga'), '2026-11-02', [0, 1, 2, 3, 4]);
        $this->week($user, $this->practica('palmas'), '2026-11-02', [0, 1]); // no vale
        $this->week($user, $this->practica('ginga'), '2026-11-18', [0, 1, 2, 3]); // en curso

        $items = $this->celebrations('/retos');

        $this->assertCount(1, $items);
        $this->assertSame(['medal', 'plata', 5, 'Ginga'], [
            $items[0]['type'], $items[0]['medal'], $items[0]['days'], $items[0]['habilidad']['name'],
        ]);
        // Ginga pide 1 semana válida: esta revela el reto secreto.
        $this->assertTrue($items[0]['secret']);

        $this->assertSame([], $this->celebrations('/retos'));
        $this->assertSame([], $this->celebrations('/retos/arbol'));
        // La de Palmas (sin medalla) también quedó marcada.
        $this->assertSame(0, RetoSemana::whereNull('celebrated_at')->where('ends_on', '<', '2026-11-20')->count());
    }

    public function test_el_secreto_se_revela_solo_con_la_semana_que_completa_las_pedidas(): void
    {
        $user = $this->actingAsRole('admin');
        $user->habilidadesDominadas()->attach($this->skill('ginga')->id, ['source' => 'manual', 'created_at' => now()]);
        $esquiva = $this->practica('esquiva'); // pide 2 semanas válidas

        $this->week($user, $esquiva, '2026-10-01', [0, 1, 2, 3]);
        $first = $this->celebrations('/');
        $this->assertFalse($first[0]['secret']);

        $this->week($user, $esquiva, '2026-10-15', [0, 1, 2, 3, 4, 5]);
        $second = $this->celebrations('/retos/arbol');
        $this->assertSame('oro', $second[0]['medal']);
        $this->assertTrue($second[0]['secret']);
    }

    public function test_una_revision_aprobada_se_celebra_con_lo_que_desbloquea(): void
    {
        $user = $this->actingAsRole('admin');
        $user->habilidadesDominadas()->attach($this->skill('ginga')->id, ['source' => 'manual', 'created_at' => now()]);
        $user->habilidadesDominadas()->attach($this->skill('negativa')->id, ['source' => 'revision', 'created_at' => now()]);
        Revision::create([
            'user_id' => $user->id, 'habilidad_id' => $this->skill('negativa')->id,
            'status' => Revision::APROBADA, 'reviewed_at' => now(),
        ]);
        Revision::create([ // rechazada: no se celebra
            'user_id' => $user->id, 'habilidad_id' => $this->skill('esquiva')->id,
            'status' => Revision::RECHAZADA, 'reviewed_at' => now(), 'comment' => 'Falta',
        ]);

        $items = $this->celebrations('/retos/arbol');

        $this->assertCount(1, $items);
        $this->assertSame(['approved', 'Negativa'], [$items[0]['type'], $items[0]['habilidad']['name']]);
        // Negativa abre Rolê y Queda de quatro (Rasteira pide también Cocorinha).
        $this->assertEqualsCanonicalizing(['Rolê', 'Queda de quatro'], array_column($items[0]['unlocks'], 'name'));

        $this->assertSame([], $this->celebrations('/retos/arbol'));
    }

    public function test_el_avance_por_arbol(): void
    {
        $user = $this->actingAsRole('admin');
        $user->habilidadesDominadas()->attach($this->skill('ginga')->id, ['source' => 'manual', 'created_at' => now()]);
        $user->habilidadesDominadas()->attach($this->skill('palmas')->id, ['source' => 'manual', 'created_at' => now()]);
        $user->habilidadesDominadas()->attach($this->skill('coro')->id, ['source' => 'manual', 'created_at' => now()]);

        $expected = ['movimiento' => ['done' => 1, 'total' => 20], 'musicalidad' => ['done' => 2, 'total' => 16]];

        $this->assertSame($expected, $this->get('/retos')->viewData('page')['props']['progress']);
        $this->assertSame($expected, $this->get('/')->viewData('page')['props']['retos']['progress']);
    }

    public function test_los_miembros_no_reciben_celebraciones(): void
    {
        $user = $this->actingAsRole('member');
        $this->week($user, $this->practica('ginga'), '2026-11-02', [0, 1, 2, 3, 4]);

        $this->get('/')->assertOk();

        $this->assertSame(1, RetoSemana::whereNull('celebrated_at')->count());
    }
}
