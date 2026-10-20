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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Demo de retos (fase C): árbol, reto secreto, revisiones y marcado manual. */
class RetosArbolTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse('2026-11-02 20:00:00', 'UTC'));
    }

    private function skill(string $slug): Habilidad
    {
        return Habilidad::where('slug', $slug)->firstOrFail();
    }

    private function reto(string $slug, string $kind = Reto::PRACTICA): Reto
    {
        return $this->skill($slug)->retos()->where('kind', $kind)->firstOrFail();
    }

    private function dominate(User $user, string ...$slugs): void
    {
        foreach ($slugs as $slug) {
            $user->habilidadesDominadas()->attach($this->skill($slug)->id, ['source' => 'manual', 'created_at' => now()]);
        }
    }

    /** @return array<string, mixed> el nodo de esa habilidad en /retos/arbol */
    private function node(string $slug, string $tree = 'movimiento'): array
    {
        $nodes = $this->get("/retos/arbol?arbol={$tree}")->assertOk()->viewData('page')['props']['nodes'];

        return collect($nodes)->firstWhere('id', $this->skill($slug)->id);
    }

    /** Deja el reto secreto de la habilidad desbloqueado (semanas válidas pasadas). */
    private function unlockSecret(User $user, string $slug): void
    {
        $skill = $this->skill($slug);
        foreach (range(1, $skill->secret_weeks) as $i) {
            $start = CarbonImmutable::parse('2026-09-01')->addWeeks($i);
            $week = RetoSemana::create([
                'user_id' => $user->id, 'reto_id' => $this->reto($slug)->id,
                'starts_on' => $start, 'ends_on' => $start->addDays(6),
            ]);
            foreach (range(0, 3) as $d) {
                Entrenamiento::create([
                    'user_id' => $user->id, 'reto_id' => $week->reto_id, 'reto_semana_id' => $week->id,
                    'duration_seconds' => 60, 'started_at' => $start->addDays($d),
                    'completed_at' => $start->addDays($d), 'completed_on' => $start->addDays($d),
                ]);
            }
        }
    }

    /** Un entrenamiento completado del reto secreto. */
    private function trainSecret(User $user, string $slug): void
    {
        Entrenamiento::create([
            'user_id' => $user->id, 'reto_id' => $this->reto($slug, Reto::SECRETO)->id,
            'duration_seconds' => 60, 'started_at' => now()->subHour(), 'completed_at' => now()->subMinutes(30),
        ]);
    }

    // ── Acceso ──────────────────────────────────────────────────────

    public function test_las_paginas_nuevas_son_solo_para_admins(): void
    {
        $other = User::factory()->create();
        $revision = Revision::create(['user_id' => $other->id, 'habilidad_id' => $this->skill('ginga')->id, 'status' => 'pendiente']);
        $this->actingAsRole('profesor');

        $this->get('/retos/arbol')->assertForbidden();
        $this->get('/retos/revisiones')->assertForbidden();
        $this->get('/retos/personas')->assertForbidden();
        $this->get("/retos/personas/{$other->id}")->assertForbidden();
        $this->post("/retos/revisiones/{$revision->id}/aprobar")->assertForbidden();
        $this->post("/retos/personas/{$other->id}/habilidades/{$this->skill('ginga')->id}")->assertForbidden();

        $this->assertSame('pendiente', $revision->fresh()?->status);
        $this->assertSame(0, $other->habilidadesDominadas()->count());
    }

    // ── Árbol ───────────────────────────────────────────────────────

    public function test_el_arbol_trae_cada_habilidad_con_su_nivel_y_estado(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');

        $this->get('/retos/arbol')->assertInertia(fn (Assert $page) => $page
            ->component('retos/arbol')
            ->where('tree', 'movimiento')
            ->has('nodes', 20));
        $this->get('/retos/arbol?arbol=musicalidad')->assertInertia(fn (Assert $page) => $page
            ->where('tree', 'musicalidad')
            ->has('nodes', 16));

        $this->assertSame(['dominada', 0], [$this->node('ginga')['status'], $this->node('ginga')['level']]);
        $this->assertSame(['disponible', 1], [$this->node('esquiva')['status'], $this->node('esquiva')['level']]);
        $this->assertSame(['bloqueada', 2], [$this->node('armada')['status'], $this->node('armada')['level']]);
        // Parafuso ← Armada pulada ← Armada/Queixada ← Meia-lua ← Ginga
        $this->assertSame(4, $this->node('parafuso')['level']);
        $this->assertEqualsCanonicalizing(
            [$this->skill('meia-lua-de-frente')->id, $this->skill('esquiva')->id],
            $this->node('armada')['requisitos'],
        );
    }

    public function test_el_reto_secreto_no_viaja_hasta_desbloquearse(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');

        $node = $this->node('esquiva');
        $this->assertNull($node['secreto']);
        $this->assertStringNotContainsString($this->reto('esquiva', Reto::SECRETO)->title, json_encode($node) ?: '');

        $this->unlockSecret($user, 'esquiva');

        $node = $this->node('esquiva');
        $this->assertSame($this->reto('esquiva', Reto::SECRETO)->title, $node['secreto']['title']);
        $this->assertSame(0, $node['secreto']['sessions']);
        $this->assertNotNull($node['review_blocked']); // falta completar el secreto una vez
    }

    public function test_el_secreto_se_entrena_y_vuelve_al_arbol(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');
        $secreto = $this->reto('esquiva', Reto::SECRETO);

        $this->get("/retos/{$secreto->id}/entrenar")->assertRedirect('/retos');

        $this->unlockSecret($user, 'esquiva');
        $this->get("/retos/{$secreto->id}/entrenar")->assertOk();
        $this->post("/retos/{$secreto->id}/entrenar");
        $session = Entrenamiento::where('reto_id', $secreto->id)->sole();
        $this->assertNull($session->reto_semana_id);

        $this->travel($secreto->totalSeconds())->seconds();
        $this->post("/retos/entrenamientos/{$session->id}/completar")
            ->assertRedirect("/retos/arbol?arbol=movimiento&habilidad={$this->skill('esquiva')->id}");

        $this->assertSame(1, $this->node('esquiva')['secreto']['sessions']);
        $this->assertNull($this->node('esquiva')['review_blocked']);
    }

    // ── Revisiones ──────────────────────────────────────────────────

    public function test_pedir_revision_exige_el_secreto_desbloqueado_y_entrenado(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');
        $esquiva = $this->skill('esquiva');

        $this->post("/retos/habilidades/{$esquiva->id}/revision")->assertSessionHas('error');
        $this->unlockSecret($user, 'esquiva');
        $this->post("/retos/habilidades/{$esquiva->id}/revision")->assertSessionHas('error');
        $this->trainSecret($user, 'esquiva');

        $this->post("/retos/habilidades/{$esquiva->id}/revision")->assertSessionHas('success');
        $this->post("/retos/habilidades/{$esquiva->id}/revision")->assertSessionHas('error'); // ya pendiente

        $this->assertSame(1, Revision::count());
        $this->assertSame('pendiente', $this->node('esquiva')['review']['status']);
        $this->get('/retos/revisiones')->assertInertia(fn (Assert $page) => $page
            ->has('pending', 1)
            ->where('pending.0.habilidad.name', 'Esquiva')
            ->where('pending.0.sessions', 1)
            ->where('pending_reviews', 1));
    }

    public function test_aprobar_domina_la_habilidad_y_desbloquea_las_siguientes(): void
    {
        $member = User::factory()->create(['name' => 'Ana']);
        $this->dominate($member, 'ginga', 'meia-lua-de-frente');
        $revision = Revision::create(['user_id' => $member->id, 'habilidad_id' => $this->skill('esquiva')->id, 'status' => 'pendiente']);
        $admin = $this->actingAsRole('admin');

        $this->post("/retos/revisiones/{$revision->id}/aprobar")->assertSessionHas('success');
        $this->post("/retos/revisiones/{$revision->id}/aprobar")->assertSessionHas('error'); // ya respondida

        $revision->refresh();
        $this->assertSame(['aprobada', $admin->id], [$revision->status, $revision->reviewer_id]);
        $pivot = $member->habilidadesDominadas()->where('habilidades.id', $this->skill('esquiva')->id)->firstOrFail()->getAttribute('pivot');
        $this->assertSame(['revision', $admin->id], [$pivot->source, $pivot->granted_by]);

        // Armada pedía Meia-lua y Esquiva: ya se puede trabajar.
        $this->get("/retos/personas/{$member->id}")->assertInertia(fn (Assert $page) => $page
            ->where('nodes', fn ($nodes) => collect($nodes)->firstWhere('id', $this->skill('armada')->id)['status'] === 'disponible'));
    }

    public function test_rechazar_pide_comentario_y_se_puede_volver_a_pedir(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');
        $this->unlockSecret($user, 'esquiva');
        $this->trainSecret($user, 'esquiva');
        $esquiva = $this->skill('esquiva');
        $this->post("/retos/habilidades/{$esquiva->id}/revision");
        $revision = Revision::sole();

        $this->post("/retos/revisiones/{$revision->id}/rechazar", ['comment' => ''])->assertSessionHasErrors('comment');
        $this->assertSame('pendiente', $revision->fresh()?->status);

        // Demo: un admin puede responder su propio pedido.
        $this->post("/retos/revisiones/{$revision->id}/rechazar", ['comment' => 'Falta bajar más la cadera.'])->assertSessionHas('success');

        $node = $this->node('esquiva');
        $this->assertSame(['rechazada', 'Falta bajar más la cadera.'], [$node['review']['status'], $node['review']['comment']]);
        $this->assertSame('disponible', $node['status']);
        $this->assertNull($node['review_blocked']);

        $this->post("/retos/habilidades/{$esquiva->id}/revision")->assertSessionHas('success');
        $this->assertSame(2, Revision::count());
    }

    // ── Marcar a mano ───────────────────────────────────────────────

    public function test_marcar_una_habilidad_marca_tambien_sus_requisitos(): void
    {
        $member = User::factory()->create();
        $admin = $this->actingAsRole('admin');

        $this->post("/retos/personas/{$member->id}/habilidades/{$this->skill('armada')->id}")
            ->assertSessionHas('success');

        $this->assertEqualsCanonicalizing(
            ['armada', 'meia-lua-de-frente', 'esquiva', 'ginga'],
            $member->habilidadesDominadas()->pluck('slug')->all(),
        );
        $this->assertSame([$admin->id], $member->habilidadesDominadas()->pluck('granted_by')->unique()->values()->all());

        // Marcar otra vez la misma: avisa y no duplica.
        $this->post("/retos/personas/{$member->id}/habilidades/{$this->skill('armada')->id}")->assertSessionHas('error');
        $this->assertSame(4, $member->habilidadesDominadas()->count());
    }

    public function test_quitar_una_habilidad_quita_tambien_las_que_dependen_de_ella(): void
    {
        $member = User::factory()->create();
        $this->dominate($member, 'ginga', 'esquiva', 'meia-lua-de-frente', 'armada', 'negativa');
        $this->actingAsRole('admin');

        $this->delete("/retos/personas/{$member->id}/habilidades/{$this->skill('esquiva')->id}")
            ->assertSessionHas('success');

        $this->assertEqualsCanonicalizing(
            ['ginga', 'meia-lua-de-frente', 'negativa'],
            $member->habilidadesDominadas()->pluck('slug')->all(),
        );
    }

    public function test_un_admin_puede_marcar_su_propio_arbol(): void
    {
        $admin = $this->actingAsRole('admin');

        $this->post("/retos/personas/{$admin->id}/habilidades/{$this->skill('ginga')->id}")->assertSessionHas('success');

        $this->assertSame(['ginga'], $admin->habilidadesDominadas()->pluck('slug')->all());
    }

    public function test_la_lista_de_personas_muestra_cuanto_domina_cada_una(): void
    {
        $member = User::factory()->create(['name' => 'Ana']);
        $this->dominate($member, 'ginga', 'palmas');
        $this->actingAsRole('admin', ['name' => 'Zoe']);

        $this->get('/retos/personas')->assertInertia(fn (Assert $page) => $page
            ->component('retos/personas')
            ->where('total', 36)
            ->where('people.0.name', 'Ana')
            ->where('people.0.dominated', 2));
    }

    // ── Varios retos el mismo día ───────────────────────────────────

    public function test_entrenar_varios_retos_el_mismo_dia_suma_un_dia_a_cada_uno(): void
    {
        $user = $this->actingAsRole('admin');
        $this->dominate($user, 'ginga');
        $retos = [$this->reto('esquiva'), $this->reto('negativa'), $this->reto('cocorinha'), Reto::where('kind', Reto::SUELTO)->firstOrFail()];
        $this->post('/retos/demo/rapido');

        foreach ($retos as $reto) {
            $this->post("/retos/{$reto->id}/semana")->assertSessionHas('success');
        }
        foreach ($retos as $reto) {
            $this->post("/retos/{$reto->id}/entrenar");
            $session = Entrenamiento::where('reto_id', $reto->id)->whereNull('completed_at')->sole();
            $this->travel($session->duration_seconds)->seconds();
            $this->post("/retos/entrenamientos/{$session->id}/completar")
                ->assertSessionHas('success', '¡Entrenamiento completado! Llevas 1 de 7 días: te faltan 3 días para el bronce.');
        }

        foreach (RetoSemana::with('entrenamientos')->get() as $semana) {
            $this->assertSame(1, $semana->daysDone(), $semana->reto->title);
        }
        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('retos.active', 4)
            ->where('retos.active.0.trained_today', true)
            ->where('retos.active.3.trained_today', true));
    }
}
