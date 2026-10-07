<?php

namespace Tests\Feature;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;
use RuntimeException;
use Tests\TestCase;

class ErrorPagesTest extends TestCase
{
    use RefreshDatabase;

    private function assertErrorPage($response, int $status): void
    {
        $response->assertStatus($status)
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertInertia(fn (Assert $page) => $page->component('error')->where('status', $status));
    }

    public function test_404_para_una_direccion_que_no_existe_aun_sin_sesion(): void
    {
        $this->assertErrorPage($this->get('/no-existe'), 404);
    }

    public function test_404_para_un_registro_que_ya_no_existe(): void
    {
        $this->actingAsRole('admin');
        $song = Song::factory()->create();
        $song->delete();

        $this->assertErrorPage($this->delete("/canciones/{$song->id}"), 404);
    }

    public function test_403_cuando_un_miembro_entra_a_admin(): void
    {
        $this->actingAsRole('member');

        $this->assertErrorPage($this->get('/admin/usuarios'), 403);
    }

    public function test_405_al_usar_el_metodo_equivocado(): void
    {
        $this->actingAsRole('member');

        $this->assertErrorPage($this->get('/auth/logout'), 405);
    }

    public function test_419_cuando_vence_la_sesion_o_el_formulario(): void
    {
        Route::middleware('web')->post('/__test/419', fn () => throw new TokenMismatchException);

        $this->assertErrorPage($this->post('/__test/419'), 419);
    }

    public function test_413_cuando_el_archivo_supera_el_limite_del_servidor(): void
    {
        Route::middleware('web')->post('/__test/413', fn () => throw new PostTooLargeException);

        $this->assertErrorPage($this->post('/__test/413'), 413);
    }

    public function test_429_con_demasiados_intentos_y_conserva_retry_after(): void
    {
        $this->actingAsRole('member', ['password_hash' => 'clave123']);

        for ($i = 0; $i < 6; $i++) {
            $this->put('/perfil/password', ['current_password' => 'mal', 'password' => 'nueva123', 'password_confirmation' => 'nueva123']);
        }

        $response = $this->put('/perfil/password', ['current_password' => 'mal', 'password' => 'nueva123', 'password_confirmation' => 'nueva123']);
        $this->assertErrorPage($response, 429);
        $response->assertHeader('Retry-After');
    }

    public function test_500_muestra_la_pagina_propia_en_produccion(): void
    {
        config(['app.debug' => false]);
        Route::middleware('web')->get('/__test/500', fn () => throw new RuntimeException('detalle interno secreto'));

        $response = $this->get('/__test/500');

        $this->assertErrorPage($response, 500);
        $response->assertDontSee('detalle interno secreto');
    }

    public function test_500_muestra_el_detalle_tecnico_en_desarrollo(): void
    {
        config(['app.debug' => true]);
        Route::middleware('web')->get('/__test/500', fn () => throw new RuntimeException('detalle para depurar'));

        $this->get('/__test/500')->assertStatus(500)->assertSee('detalle para depurar');
    }

    public function test_503_en_modo_mantenimiento(): void
    {
        $this->app->maintenanceMode()->activate([]);

        try {
            $this->assertErrorPage($this->get('/auth/login'), 503);
        } finally {
            $this->app->maintenanceMode()->deactivate();
        }
    }

    public function test_un_cliente_json_recibe_json_y_no_html(): void
    {
        $this->getJson('/no-existe')->assertStatus(404)->assertJsonStructure(['message']);
    }

    public function test_las_visitas_de_inertia_tambien_reciben_la_pagina_de_error(): void
    {
        $this->actingAsRole('member');
        $version = (string) app(HandleInertiaRequests::class)->version(request());

        $this->get('/admin/usuarios', ['X-Inertia' => 'true', 'X-Inertia-Version' => $version, 'X-Requested-With' => 'XMLHttpRequest'])
            ->assertStatus(403)
            ->assertJsonPath('component', 'error')
            ->assertJsonPath('props.status', 403);
    }

    public function test_si_la_pagina_de_react_falla_se_usa_la_version_html(): void
    {
        // Simula que la vista raíz de Inertia no se puede renderizar.
        Inertia::setRootView('vista-que-no-existe');

        $this->get('/no-existe')
            ->assertStatus(404)
            ->assertSee('Página no encontrada')
            ->assertSee('Ir al inicio');
    }

    public function test_las_versiones_de_respaldo_en_html_existen_y_se_ven_bien(): void
    {
        foreach ([403, 404, 405, 413, 419, 429, 500, 503] as $status) {
            $html = view("errors.{$status}")->render();

            $this->assertStringContainsString((string) $status, $html);
            $this->assertStringContainsString('Ir al inicio', $html);
            $this->assertStringNotContainsString('@vite', $html);
        }

        $this->assertStringContainsString('Recargar la página', view('errors.419')->render());
        $this->assertStringContainsString('Volver atrás', view('errors.404')->render());
    }
}
