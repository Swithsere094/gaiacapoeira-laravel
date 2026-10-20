<?php

namespace Tests\Feature;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\User;
use App\Support\RetosDemo;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Demo de retos (fase B): aceptar, entrenar, completar y controles de prueba. */
class RetosFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // 15:00 en Colombia.
        $this->travelTo(CarbonImmutable::parse('2026-11-02 20:00:00', 'UTC'));
    }

    private function practica(string $slug): Reto
    {
        return Habilidad::where('slug', $slug)->firstOrFail()->retos()->where('kind', Reto::PRACTICA)->firstOrFail();
    }

    /** @return array<string, mixed> */
    private function props(string $url): array
    {
        return $this->get($url)->assertOk()->viewData('page')['props'];
    }

    /** Inicia y completa un entrenamiento (esperando lo que dure). */
    private function train(Reto $reto): void
    {
        $this->post("/retos/{$reto->id}/entrenar")->assertRedirect("/retos/{$reto->id}/entrenar");
        $session = Entrenamiento::where('reto_id', $reto->id)->whereNull('completed_at')->latest('started_at')->firstOrFail();

        $this->travel($session->duration_seconds)->seconds();
        $this->post("/retos/entrenamientos/{$session->id}/completar")->assertRedirect('/retos');
    }

    // ── Acceso ──────────────────────────────────────────────────────

    public function test_es_solo_para_admins(): void
    {
        $reto = $this->practica('ginga');
        $this->actingAsRole('profesor');

        $this->get('/retos')->assertForbidden();
        $this->post("/retos/{$reto->id}/semana")->assertForbidden();
        $this->get("/retos/{$reto->id}/entrenar")->assertForbidden();
        $this->post('/retos/demo/dia-siguiente')->assertForbidden();

        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('retos', null));
        $this->get('/perfil')->assertInertia(fn (Assert $page) => $page->where('medallas', null));
        $this->assertSame(0, RetoSemana::count());
    }

    public function test_el_admin_ve_sus_retos_en_el_inicio_y_la_pagina_de_retos(): void
    {
        $this->actingAsRole('admin');

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('retos.active', 0)
            ->where('retos.today', '2026-11-02'));

        $this->get('/retos')->assertInertia(fn (Assert $page) => $page
            ->component('retos/index')
            ->has('active', 0)
            ->has('frontier', 2)
            ->has('sueltos', 5)
            ->where('frontier.0.name', 'Ginga')
            ->where('frontier.0.blocked', null)
            ->where('demo', ['today' => '2026-11-02', 'offset' => 0, 'fast' => false]));
    }

    // ── Aceptar y abandonar ─────────────────────────────────────────

    public function test_aceptar_un_reto_abre_una_semana_de_7_dias(): void
    {
        $user = $this->actingAsRole('admin');
        $reto = $this->practica('ginga');

        $this->post("/retos/{$reto->id}/semana")->assertSessionHas('success');
        $this->post("/retos/{$reto->id}/semana")->assertSessionHas('error');

        $semana = RetoSemana::sole();
        $this->assertSame($user->id, $semana->user_id);
        $this->assertSame('2026-11-02', $semana->starts_on->toDateString());
        $this->assertSame('2026-11-08', $semana->ends_on->toDateString());

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('retos.active', 1)
            ->where('retos.active.0.day', 1)
            ->where('retos.active.0.trained_today', false));
    }

    public function test_no_se_acepta_el_reto_de_una_habilidad_bloqueada(): void
    {
        $this->actingAsRole('admin');

        $this->post("/retos/{$this->practica('armada')->id}/semana")->assertSessionHas('error');

        $this->assertSame(0, RetoSemana::count());
    }

    public function test_abandonar_un_reto(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post("/retos/{$reto->id}/semana");
        $semana = RetoSemana::sole();

        $this->post("/retos/semanas/{$semana->id}/abandonar")->assertSessionHas('success');

        $this->assertNotNull($semana->fresh()?->abandoned_at);
        // Se puede volver a aceptar.
        $this->post("/retos/{$reto->id}/semana")->assertSessionHas('success');
    }

    public function test_no_se_abandona_la_semana_de_otra_persona(): void
    {
        $other = User::factory()->admin()->create();
        $semana = RetoSemana::create([
            'user_id' => $other->id, 'reto_id' => $this->practica('ginga')->id,
            'starts_on' => '2026-11-02', 'ends_on' => '2026-11-08',
        ]);
        $this->actingAsRole('admin');

        $this->post("/retos/semanas/{$semana->id}/abandonar")->assertNotFound();
        $this->assertNull($semana->fresh()?->abandoned_at);
    }

    // ── Entrenamiento guiado ────────────────────────────────────────

    public function test_sin_aceptar_el_reto_no_se_entrena(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');

        $this->get("/retos/{$reto->id}/entrenar")->assertRedirect('/retos');
        $this->post("/retos/{$reto->id}/entrenar")->assertRedirect('/retos');
        $this->assertSame(0, Entrenamiento::count());
    }

    public function test_el_entrenamiento_solo_se_completa_si_paso_su_duracion(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post("/retos/{$reto->id}/semana");

        $this->get("/retos/{$reto->id}/entrenar")->assertInertia(fn (Assert $page) => $page
            ->component('retos/entrenar')
            ->where('session', null)
            ->has('reto.steps', count($reto->steps)));

        $this->post("/retos/{$reto->id}/entrenar");
        $session = Entrenamiento::sole();
        $this->assertSame($reto->totalSeconds(), $session->duration_seconds);

        // Iniciar otra vez retoma la misma sesión.
        $this->post("/retos/{$reto->id}/entrenar");
        $this->assertSame(1, Entrenamiento::count());
        $this->get("/retos/{$reto->id}/entrenar")->assertInertia(fn (Assert $page) => $page
            ->where('session.id', $session->id));

        $this->travel(60)->seconds();
        $this->post("/retos/entrenamientos/{$session->id}/completar")->assertSessionHas('error');
        $this->assertNull($session->fresh()?->completed_at);

        $this->travel($reto->totalSeconds())->seconds();
        $this->post("/retos/entrenamientos/{$session->id}/completar")
            ->assertRedirect('/retos')
            ->assertSessionHas('success', '¡Entrenamiento completado! Llevas 1 de 7 días: te faltan 3 días para el bronce.');

        $this->assertSame('2026-11-02', $session->fresh()?->completed_on?->toDateString());
    }

    public function test_entrenar_dos_veces_el_mismo_dia_suma_un_solo_dia_y_lo_avisa(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post("/retos/{$reto->id}/semana");
        $this->post('/retos/demo/rapido');

        $this->train($reto);
        $this->post("/retos/{$reto->id}/entrenar");
        $session = Entrenamiento::whereNull('completed_at')->sole();
        $this->travel($session->duration_seconds)->seconds();

        $this->post("/retos/entrenamientos/{$session->id}/completar")->assertSessionHas(
            'success',
            '¡Entrenamiento completado! Hoy ya contaba, así que no suma otro día. Llevas 1 de 7 días: te faltan 3 días para el bronce.',
        );
    }

    public function test_no_se_completa_el_entrenamiento_de_otra_persona(): void
    {
        $other = User::factory()->admin()->create();
        $reto = $this->practica('ginga');
        $session = Entrenamiento::create([
            'user_id' => $other->id, 'reto_id' => $reto->id,
            'duration_seconds' => 10, 'started_at' => now()->subHour(),
        ]);
        $this->actingAsRole('admin');

        $this->post("/retos/entrenamientos/{$session->id}/completar")->assertNotFound();
        $this->assertNull($session->fresh()?->completed_at);
    }

    public function test_el_reto_secreto_bloqueado_no_se_entrena(): void
    {
        $this->actingAsRole('admin');
        $secreto = Habilidad::where('slug', 'ginga')->firstOrFail()->retos()->where('kind', Reto::SECRETO)->firstOrFail();

        $this->get("/retos/{$secreto->id}/entrenar")->assertRedirect('/retos');
        $this->post("/retos/{$secreto->id}/semana")->assertSessionHas('error');
    }

    // ── Controles de prueba ─────────────────────────────────────────

    public function test_el_cronometro_rapido_acorta_la_duracion_exigida(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post("/retos/{$reto->id}/semana");

        $this->post('/retos/demo/rapido');
        $this->post("/retos/{$reto->id}/entrenar");

        $this->assertSame((int) ceil($reto->totalSeconds() / RetosDemo::FAST_FACTOR), Entrenamiento::sole()->duration_seconds);
    }

    public function test_una_semana_completa_simulando_dias_termina_en_medalla(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post('/retos/demo/rapido');
        $this->post("/retos/{$reto->id}/semana");

        // Entrena 5 de los 7 días (dos veces el primero: cuenta uno).
        $this->train($reto);
        foreach ([true, true, false, true, true, false, true] as $trains) {
            if ($trains) {
                $this->train($reto);
            }
            $this->post('/retos/demo/dia-siguiente');
        }
        // Ya es el día 8: la semana terminó y no se puede entrenar.
        $this->post("/retos/{$reto->id}/entrenar")->assertRedirect('/retos');
        $this->assertSame(5, RetoSemana::with('entrenamientos')->sole()->daysDone());

        $props = $this->props('/retos');
        $this->assertSame([], $props['active']);
        $this->assertSame('plata', $props['finished'][0]['medal']);
        $this->assertSame(['oro' => 0, 'plata' => 1, 'bronce' => 0], $props['frontier'][0]['reto']['medals']);

        $this->get('/perfil')->assertInertia(fn (Assert $page) => $page
            ->has('medallas', 1)
            ->where('medallas.0.title', $reto->title)
            ->where('medallas.0.plata', 1));
    }

    public function test_si_la_semana_termino_el_entrenamiento_no_cuenta(): void
    {
        $this->actingAsRole('admin');
        $reto = $this->practica('ginga');
        $this->post("/retos/{$reto->id}/semana");
        $this->post("/retos/{$reto->id}/entrenar");
        $session = Entrenamiento::sole();

        foreach (range(1, 7) as $_) {
            $this->post('/retos/demo/dia-siguiente');
        }
        $this->travel($reto->totalSeconds())->seconds();

        $this->post("/retos/entrenamientos/{$session->id}/completar")->assertSessionHas('error');
        $this->assertNull($session->fresh()?->completed_on);
    }

    public function test_reiniciar_borra_el_progreso_propio_y_vuelve_a_hoy(): void
    {
        $user = $this->actingAsRole('admin');
        $other = User::factory()->admin()->create();
        $reto = $this->practica('ginga');

        RetoSemana::create(['user_id' => $other->id, 'reto_id' => $reto->id, 'starts_on' => '2026-11-02', 'ends_on' => '2026-11-08']);
        $user->habilidadesDominadas()->attach(Habilidad::where('slug', 'ginga')->value('id'), ['source' => 'manual', 'created_at' => now()]);
        $this->post("/retos/{$reto->id}/semana");
        $this->post("/retos/{$reto->id}/entrenar");
        $this->post('/retos/demo/dia-siguiente');

        $this->post('/retos/demo/reiniciar')->assertSessionHas('success');

        $this->assertSame(0, RetoSemana::where('user_id', $user->id)->count());
        $this->assertSame(0, Entrenamiento::where('user_id', $user->id)->count());
        $this->assertSame(0, $user->habilidadesDominadas()->count());
        $this->assertSame(1, RetoSemana::where('user_id', $other->id)->count());
        $this->assertSame(0, $this->props('/retos')['demo']['offset']);
    }
}
