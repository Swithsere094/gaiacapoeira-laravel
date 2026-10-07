<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\PageView;
use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    // ── Registro de visitas (lo hace el servidor) ───────────────────

    public function test_registra_una_visita_con_ruta_y_usuario(): void
    {
        $user = $this->actingAsRole('member');

        $this->get('/canciones?tab=algo')->assertOk();

        $this->assertDatabaseHas('page_views', ['path' => '/canciones', 'user_id' => $user->id]);
        $this->assertDatabaseCount('page_views', 1);
    }

    public function test_registra_la_pagina_de_login_sin_usuario(): void
    {
        $this->get('/auth/login')->assertOk();

        $this->assertDatabaseHas('page_views', ['path' => '/auth/login', 'user_id' => null]);
    }

    public function test_registra_el_inicio_como_barra(): void
    {
        $this->actingAsRole('member');

        $this->get('/');

        $this->assertDatabaseHas('page_views', ['path' => '/']);
    }

    public function test_cuenta_las_navegaciones_de_inertia(): void
    {
        $this->actingAsRole('member');

        $this->get('/galera', ['X-Inertia' => 'true', 'X-Inertia-Version' => $this->inertiaVersion()])->assertOk();

        $this->assertDatabaseHas('page_views', ['path' => '/galera']);
    }

    public function test_no_cuenta_redirecciones_ni_errores_ni_acciones(): void
    {
        $this->get('/canciones'); // redirige al login (sin sesión)
        $this->actingAsRole('member');
        $this->get('/admin/usuarios'); // 403
        $this->get('/no-existe'); // 404
        $this->post('/canciones', ['title' => 'X', 'type' => 'corrido', 'lyrics' => 'x']); // acción

        $this->assertDatabaseCount('page_views', 0);
    }

    public function test_no_cuenta_recargas_parciales_ni_prefetch(): void
    {
        $this->actingAsRole('member');
        $headers = ['X-Inertia' => 'true', 'X-Inertia-Version' => $this->inertiaVersion()];

        $this->get('/canciones', [...$headers, 'X-Inertia-Partial-Component' => 'canciones', 'X-Inertia-Partial-Data' => 'songs']);
        $this->get('/canciones', [...$headers, 'Purpose' => 'prefetch']);

        $this->assertDatabaseCount('page_views', 0);
    }

    public function test_ya_no_existe_el_endpoint_publico_de_visitas(): void
    {
        $this->post('/api/analytics/pageview', ['path' => '/inventada'])->assertStatus(404);
        $this->assertDatabaseCount('page_views', 0);
    }

    // ── Panel (solo admin) ──────────────────────────────────────────

    public function test_el_panel_es_solo_para_admin(): void
    {
        $this->actingAsRole('member');

        $this->get('/admin/analytics')->assertForbidden();
    }

    public function test_el_panel_resume_totales_paginas_y_30_dias(): void
    {
        $admin = $this->actingAsRole('admin');
        PageView::insert([
            ['id' => fake()->uuid(), 'path' => '/canciones', 'user_id' => $admin->id, 'created_at' => now()],
            ['id' => fake()->uuid(), 'path' => '/canciones', 'user_id' => null, 'created_at' => now()->subDays(2)],
            ['id' => fake()->uuid(), 'path' => '/galera', 'user_id' => $admin->id, 'created_at' => now()->subDays(40)],
        ]);

        $this->get('/admin/analytics')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/analytics')
            // la propia visita al panel no está todavía (se registra después de responder)
            ->where('summary.totalViews', 3)
            ->where('summary.uniqueUsers', 1)
            ->where('summary.topPages.0', ['path' => '/canciones', 'count' => 2])
            ->has('summary.viewsByDay', 30)
            ->where('summary.viewsByDay.29.day', now('UTC')->format('Y-m-d'))
            ->where('summary.viewsByDay.29.count', 1)
            ->where('summary.viewsByDay.27.count', 1)
        );
    }

    public function test_una_falla_al_registrar_no_rompe_la_pagina(): void
    {
        $this->actingAsRole('member');
        Song::factory()->create();
        PageView::creating(fn () => throw new \RuntimeException('base caída'));

        $this->get('/canciones')->assertOk();
    }

    private function inertiaVersion(): string
    {
        return (string) app(HandleInertiaRequests::class)->version(request());
    }
}
