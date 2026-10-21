<?php

namespace Tests\Feature;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\User;
use App\Support\Progreso;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Demo de retos y árbol de habilidades: contenido provisorio y reglas. */
class RetosTest extends TestCase
{
    use RefreshDatabase;

    private CarbonImmutable $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = CarbonImmutable::parse('2026-11-20');
    }

    private function skill(string $slug): Habilidad
    {
        return Habilidad::where('slug', $slug)->firstOrFail();
    }

    private function practica(string $slug): Reto
    {
        return $this->skill($slug)->retos()->where('kind', Reto::PRACTICA)->firstOrFail();
    }

    private function dominate(User $user, string ...$slugs): void
    {
        foreach ($slugs as $slug) {
            $user->habilidadesDominadas()->attach($this->skill($slug)->id, ['source' => 'manual', 'created_at' => now()]);
        }
    }

    /**
     * Una semana del reto que empieza `$startsOn`, con un entrenamiento
     * completado en cada uno de esos días (desde el inicio: 0 = primer día).
     *
     * @param  list<int>  $days
     */
    private function week(User $user, Reto $reto, string $startsOn, array $days, bool $abandoned = false): RetoSemana
    {
        $start = CarbonImmutable::parse($startsOn);
        $week = RetoSemana::create([
            'user_id' => $user->id, 'reto_id' => $reto->id,
            'starts_on' => $start, 'ends_on' => $start->addDays(RetoSemana::DAYS - 1),
            'abandoned_at' => $abandoned ? now() : null,
        ]);

        foreach ($days as $day) {
            $on = $start->addDays($day);
            Entrenamiento::create([
                'user_id' => $user->id, 'reto_id' => $reto->id, 'reto_semana_id' => $week->id,
                'duration_seconds' => $reto->totalSeconds(),
                'started_at' => $on->setTime(18, 0), 'completed_at' => $on->setTime(18, 15), 'completed_on' => $on,
            ]);
        }

        return $week;
    }

    private function progreso(User $user, ?CarbonImmutable $today = null): Progreso
    {
        return new Progreso($user, $today ?? $this->today);
    }

    // ── Contenido provisorio ────────────────────────────────────────

    public function test_la_migracion_carga_los_dos_arboles_y_los_retos_sueltos(): void
    {
        $this->assertSame(20, Habilidad::where('tree', Habilidad::MOVIMIENTO)->count());
        $this->assertSame(16, Habilidad::where('tree', Habilidad::MUSICALIDAD)->count());
        $this->assertSame(5, Reto::where('kind', Reto::SUELTO)->whereNull('habilidad_id')->count());

        foreach (Habilidad::with('retos')->get() as $habilidad) {
            $this->assertSame([Reto::PRACTICA, Reto::SECRETO], $habilidad->retos->pluck('kind')->all(), $habilidad->slug);
            $this->assertNotNull($habilidad->icon, "{$habilidad->slug} sin ícono");
        }
    }

    public function test_cada_entrenamiento_dura_entre_10_y_20_minutos(): void
    {
        foreach (Reto::all() as $reto) {
            $minutes = $reto->totalSeconds() / 60;
            $this->assertTrue($minutes >= 10 && $minutes <= 20, "{$reto->title}: {$minutes} min");

            foreach ($reto->steps as $step) {
                $this->assertNotEmpty($step['title']);
                $this->assertGreaterThan(0, $step['seconds']);
            }
        }
    }

    public function test_los_requisitos_son_del_mismo_arbol_y_no_forman_ciclos(): void
    {
        $all = Habilidad::with('requisitos')->get()->keyBy('id');
        $roots = $all->filter(fn (Habilidad $h) => $h->requisitos->isEmpty());

        $this->assertEqualsCanonicalizing(['ginga', 'palmas'], $roots->pluck('slug')->all());

        // Recorriendo desde las raíces se llega a todas: no hay ciclos ni
        // habilidades imposibles de desbloquear.
        $reached = [];
        do {
            $added = false;
            foreach ($all as $h) {
                if (! isset($reached[$h->id]) && $h->requisitos->every(fn (Habilidad $r) => isset($reached[$r->id]))) {
                    $reached[$h->id] = true;
                    $added = true;
                }
                foreach ($h->requisitos as $r) {
                    $this->assertSame($h->tree, $r->tree, "{$h->slug} ← {$r->slug}");
                }
            }
        } while ($added);

        $this->assertCount($all->count(), $reached);
    }

    public function test_la_carga_no_se_repite_si_ya_hay_contenido(): void
    {
        $migration = require database_path('migrations/2026_10_20_000001_load_provisional_skill_trees.php');
        $migration->up();

        $this->assertSame(36, Habilidad::count());
    }

    // ── Medallas ────────────────────────────────────────────────────

    public function test_la_medalla_depende_de_los_dias_de_la_semana(): void
    {
        $expected = [0 => null, 1 => null, 2 => null, 3 => null, 4 => 'bronce', 5 => 'plata', 6 => 'oro', 7 => 'oro'];

        foreach ($expected as $days => $medal) {
            $this->assertSame($medal, RetoSemana::medalForDays($days), "{$days} días");
        }
    }

    public function test_la_medalla_se_gana_al_terminar_la_semana_y_cuenta_dias_distintos(): void
    {
        $user = User::factory()->create();
        $week = $this->week($user, $this->practica('ginga'), '2026-11-02', [0, 1, 1, 3, 6]);

        $this->assertSame(4, $week->daysDone()); // dos sesiones el mismo día cuentan uno
        $this->assertNull($week->medal(CarbonImmutable::parse('2026-11-08'))); // último día: sigue en curso
        $this->assertTrue($week->isActive(CarbonImmutable::parse('2026-11-08')));
        $this->assertSame('bronce', $week->medal(CarbonImmutable::parse('2026-11-09')));
    }

    public function test_una_semana_abandonada_no_da_medalla(): void
    {
        $user = User::factory()->create();
        $week = $this->week($user, $this->practica('ginga'), '2026-11-02', [0, 1, 2, 3, 4, 5, 6], abandoned: true);

        $this->assertNull($week->medal($this->today));
        $this->assertSame([], $this->progreso($user)->medals());
    }

    public function test_las_medallas_se_acumulan_por_reto(): void
    {
        $user = User::factory()->create();
        $ginga = $this->practica('ginga');
        $suelto = Reto::where('kind', Reto::SUELTO)->firstOrFail();

        $this->week($user, $ginga, '2026-10-01', [0, 1, 2, 3, 4, 5, 6]);
        $this->week($user, $ginga, '2026-10-08', [0, 1, 2, 3, 4, 5]);
        $this->week($user, $ginga, '2026-10-15', [0, 1, 2, 3, 4]);
        $this->week($user, $ginga, '2026-10-22', [0, 1, 2]); // no vale
        $this->week($user, $suelto, '2026-10-01', [0, 1, 2, 3]);
        $this->week($user, $ginga, '2026-11-18', [0, 1, 2]); // en curso

        $this->assertSame([
            $ginga->id => ['oro' => 2, 'plata' => 1, 'bronce' => 0],
            $suelto->id => ['oro' => 0, 'plata' => 0, 'bronce' => 1],
        ], $this->progreso($user)->medals());
    }

    // ── Árbol ───────────────────────────────────────────────────────

    public function test_al_empezar_la_frontera_son_las_raices(): void
    {
        $progreso = $this->progreso(User::factory()->create());

        $this->assertEqualsCanonicalizing(
            [$this->skill('ginga')->id, $this->skill('palmas')->id],
            $progreso->frontier(),
        );
    }

    public function test_dominar_una_habilidad_abre_las_que_dependen_solo_de_ella(): void
    {
        $user = User::factory()->create();
        $this->dominate($user, 'ginga');

        $frontier = Habilidad::whereIn('id', $this->progreso($user)->frontier())->pluck('slug')->all();

        $this->assertEqualsCanonicalizing(
            ['esquiva', 'negativa', 'cocorinha', 'guarda-baixa', 'meia-lua-de-frente', 'au', 'palmas'],
            $frontier,
        );
    }

    public function test_una_habilidad_con_dos_requisitos_necesita_los_dos(): void
    {
        $user = User::factory()->create();
        $armada = $this->skill('armada')->id;

        $this->dominate($user, 'ginga', 'meia-lua-de-frente');
        $this->assertFalse($this->progreso($user)->isUnlocked($armada));

        $this->dominate($user, 'esquiva');
        $this->assertTrue($this->progreso($user)->isUnlocked($armada));
    }

    public function test_el_reto_secreto_aparece_con_las_semanas_validas_de_la_habilidad(): void
    {
        $user = User::factory()->create();
        $this->dominate($user, 'ginga');
        $esquiva = $this->skill('esquiva'); // 2 semanas
        $this->assertSame(2, $esquiva->secret_weeks);

        $this->week($user, $this->practica('esquiva'), '2026-10-01', [0, 1, 2, 3]);
        $this->week($user, $this->practica('esquiva'), '2026-10-08', [0, 1, 2]); // no vale
        $this->week($user, $this->practica('negativa'), '2026-10-01', [0, 1, 2, 3, 4, 5]); // otra habilidad
        $this->assertFalse($this->progreso($user)->secretUnlocked($esquiva->id));

        $this->week($user, $this->practica('esquiva'), '2026-10-15', [0, 1, 2, 3, 4]);
        $this->assertSame(2, $this->progreso($user)->validWeeks($esquiva->id));
        $this->assertTrue($this->progreso($user)->secretUnlocked($esquiva->id));
    }

    public function test_sin_desbloquear_la_habilidad_no_aparece_su_secreto(): void
    {
        $user = User::factory()->create();
        $esquiva = $this->skill('esquiva');

        $this->week($user, $this->practica('esquiva'), '2026-10-01', [0, 1, 2, 3]);
        $this->week($user, $this->practica('esquiva'), '2026-10-08', [0, 1, 2, 3]);

        $this->assertFalse($this->progreso($user)->secretUnlocked($esquiva->id));
    }

    // ── Empezar una semana ──────────────────────────────────────────

    public function test_no_se_empieza_un_reto_de_una_habilidad_bloqueada(): void
    {
        $progreso = $this->progreso(User::factory()->create());

        $this->assertNull($progreso->cannotStartWeek($this->practica('ginga')));
        $this->assertNotNull($progreso->cannotStartWeek($this->practica('negativa')));
    }

    public function test_un_reto_en_curso_por_habilidad_y_por_reto_suelto(): void
    {
        $user = User::factory()->create();
        $this->dominate($user, 'ginga');
        $suelto = Reto::where('kind', Reto::SUELTO)->firstOrFail();

        $this->week($user, $this->practica('negativa'), '2026-11-18', [0]);
        $this->week($user, $suelto, '2026-11-18', []);
        $progreso = $this->progreso($user);

        $this->assertNotNull($progreso->cannotStartWeek($this->practica('negativa')));
        $this->assertNotNull($progreso->cannotStartWeek($suelto));
        // Otras habilidades de la frontera sí, en paralelo.
        $this->assertNull($progreso->cannotStartWeek($this->practica('esquiva')));
        $this->assertNull($progreso->cannotStartWeek($this->practica('cocorinha')));
        // Una habilidad ya dominada se puede seguir practicando.
        $this->assertNull($progreso->cannotStartWeek($this->practica('ginga')));
    }

    public function test_al_terminar_o_abandonar_la_semana_se_puede_empezar_otra(): void
    {
        $user = User::factory()->create();
        $ginga = $this->practica('ginga');

        $this->week($user, $ginga, '2026-11-01', [0, 1, 2, 3]);
        $this->week($user, $ginga, '2026-11-18', [0], abandoned: true);

        $this->assertNull($this->progreso($user)->cannotStartWeek($ginga));
    }

    public function test_el_reto_secreto_no_se_hace_por_semanas(): void
    {
        $secreto = $this->skill('ginga')->retos()->where('kind', Reto::SECRETO)->firstOrFail();

        $this->assertNotNull($this->progreso(User::factory()->create())->cannotStartWeek($secreto));
    }

    // ── Datos de la persona ─────────────────────────────────────────

    public function test_al_eliminar_a_la_persona_se_borra_su_progreso(): void
    {
        $user = User::factory()->create();
        $this->dominate($user, 'ginga');
        $this->week($user, $this->practica('ginga'), '2026-11-01', [0, 1]);

        $user->delete();

        foreach (['habilidades_dominadas', 'reto_semanas', 'entrenamientos'] as $table) {
            $this->assertSame(0, DB::table($table)->count(), $table);
        }
        $this->assertSame(36, Habilidad::count());
    }
}
