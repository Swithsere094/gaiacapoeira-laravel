<?php

namespace Tests\Feature;

use App\Models\EventoPrueba;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Prueba de concepto de subdominios por evento con la API de Hostinger
 * (simulada con Http::fake: nunca se llama a la API real).
 */
class EventosPruebaTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'token-secreto-de-prueba';

    private const API = 'https://developers.hostinger.com/api/hosting/v1/accounts/u000000000/websites/gaiacapoeira.com/subdomains';

    private string $logPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->logPath = sys_get_temp_dir().'/hostinger-test-'.uniqid().'.log';

        config([
            'services.hostinger.token' => self::TOKEN,
            'services.hostinger.url' => 'https://developers.hostinger.com',
            'services.hostinger.username' => 'u000000000',
            'services.hostinger.domain' => 'gaiacapoeira.com',
            'logging.channels.hostinger.path' => $this->logPath,
        ]);
    }

    protected function tearDown(): void
    {
        @unlink($this->logPath);

        parent::tearDown();
    }

    private function evento(string $slug, string $estado = EventoPrueba::CREADO): EventoPrueba
    {
        return EventoPrueba::create(['nombre' => ucfirst($slug), 'slug' => $slug, 'estado' => $estado]);
    }

    // ── Acceso ──────────────────────────────────────────────────────

    public function test_solo_admins_entran_al_formulario(): void
    {
        Http::fake();

        $this->get('/admin/eventos-prueba')->assertRedirect('/auth/login');

        $this->actingAsRole('member');
        $this->get('/admin/eventos-prueba')->assertForbidden();
        $this->post('/admin/eventos-prueba', ['nombre' => 'Batizado'])->assertForbidden();

        Http::assertNothingSent();
        $this->assertDatabaseCount('eventos_prueba', 0);
    }

    public function test_el_admin_ve_la_lista(): void
    {
        $this->actingAsRole('admin');
        $this->evento('batizado');

        $this->get('/admin/eventos-prueba')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/eventos-prueba')
            ->has('eventos', 1)
            ->where('eventos.0.slug', 'batizado')
            ->where('eventos.0.subdominio_url', 'https://batizado.gaiacapoeira.com')
            ->where('eventos.0.respaldo_url', '/eventos-prueba/batizado')
            ->where('dominio', 'gaiacapoeira.com')
            ->where('configurado', true)
        );
    }

    // ── Crear ───────────────────────────────────────────────────────

    public function test_creacion_exitosa(): void
    {
        $this->actingAsRole('admin');
        Http::fake([self::API => Http::response(['message' => 'Request accepted'])]);

        $this->post('/admin/eventos-prueba', ['nombre' => 'Batizado Ñandú 2027'])
            ->assertRedirect()
            ->assertSessionHas('success');

        $evento = EventoPrueba::sole();
        $this->assertSame('batizado-nandu-2027', $evento->slug);
        $this->assertSame('Batizado Ñandú 2027', $evento->nombre);
        $this->assertSame(EventoPrueba::CREADO, $evento->estado);
        $this->assertSame('Request accepted', $evento->respuesta_api['body']['message'] ?? null);

        Http::assertSent(fn (Request $r) => $r->method() === 'POST'
            && $r->url() === self::API
            && $r->hasHeader('Authorization', 'Bearer '.self::TOKEN)
            && $r->hasHeader('Accept', 'application/json')
            && $r->data() === ['subdomain' => 'batizado-nandu-2027', 'is_using_public_directory' => true]);

        // El log tiene la petición y la respuesta, pero nunca el token.
        $log = (string) file_get_contents($this->logPath);
        $this->assertStringContainsString('batizado-nandu-2027', $log);
        $this->assertStringContainsString('Request accepted', $log);
        $this->assertStringNotContainsString(self::TOKEN, $log);
    }

    public function test_error_de_la_api(): void
    {
        $this->actingAsRole('admin');
        Http::fake([self::API => Http::response([
            'message' => 'The subdomain has already been taken.',
            'errors' => ['subdomain' => ['The subdomain has already been taken.']],
            'correlation_id' => 'abc',
        ], 422)]);

        $this->post('/admin/eventos-prueba', ['nombre' => 'Roda de verano'])
            ->assertRedirect()
            ->assertSessionHas('error', 'Hostinger no creó el subdominio: The subdomain has already been taken.');

        $evento = EventoPrueba::sole();
        $this->assertSame(EventoPrueba::ERROR, $evento->estado);
        $this->assertSame(422, $evento->respuesta_api['status'] ?? null);
        $this->assertStringNotContainsString(self::TOKEN, (string) file_get_contents($this->logPath));
    }

    public function test_sin_conexion_con_la_api_queda_en_error(): void
    {
        $this->actingAsRole('admin');
        Http::fake([self::API => Http::failedConnection()]);

        $this->post('/admin/eventos-prueba', ['nombre' => 'Roda de verano'])->assertSessionHas('error');

        $this->assertSame(EventoPrueba::ERROR, EventoPrueba::sole()->estado);
    }

    public function test_sin_variables_no_llama_a_la_api(): void
    {
        $this->actingAsRole('admin');
        config(['services.hostinger.token' => null]);
        Http::fake();

        $this->post('/admin/eventos-prueba', ['nombre' => 'Roda de verano'])->assertSessionHas('error');

        Http::assertNothingSent();
        $this->assertSame(EventoPrueba::ERROR, EventoPrueba::sole()->estado);
    }

    public function test_slug_reservado(): void
    {
        $this->actingAsRole('admin');
        Http::fake();

        foreach (['www', 'Mail', 'ADMIN', 'api', 'autodiscover', 'ns1'] as $nombre) {
            $this->post('/admin/eventos-prueba', ['nombre' => $nombre])->assertSessionHasErrors('nombre');
        }

        Http::assertNothingSent();
        $this->assertDatabaseCount('eventos_prueba', 0);
    }

    public function test_slug_duplicado(): void
    {
        $this->actingAsRole('admin');
        $this->evento('batizado-2027');
        Http::fake();

        // Otro nombre que da el mismo slug.
        $this->post('/admin/eventos-prueba', ['nombre' => 'Batizado  2027!'])
            ->assertSessionHasErrors(['nombre' => 'Ya existe un evento con el subdominio «batizado-2027»']);

        Http::assertNothingSent();
        $this->assertDatabaseCount('eventos_prueba', 1);
    }

    public function test_slug_muy_corto_muy_largo_o_vacio(): void
    {
        $this->actingAsRole('admin');
        Http::fake();

        $this->post('/admin/eventos-prueba', ['nombre' => 'ab'])->assertSessionHasErrors('nombre');
        $this->post('/admin/eventos-prueba', ['nombre' => str_repeat('a', 64)])->assertSessionHasErrors('nombre');
        $this->post('/admin/eventos-prueba', ['nombre' => '¡¿?!'])->assertSessionHasErrors('nombre');
        $this->post('/admin/eventos-prueba', ['nombre' => ''])->assertSessionHasErrors('nombre');

        Http::assertNothingSent();
        $this->assertDatabaseCount('eventos_prueba', 0);
    }

    // ── Eliminar ────────────────────────────────────────────────────

    public function test_eliminar_borra_el_subdominio_y_el_registro(): void
    {
        $this->actingAsRole('admin');
        $evento = $this->evento('batizado');
        Http::fake([self::API.'/batizado' => Http::response(['message' => 'Request accepted'])]);

        $this->delete("/admin/eventos-prueba/{$evento->id}")->assertSessionHas('success');

        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && $r->url() === self::API.'/batizado');
        $this->assertDatabaseCount('eventos_prueba', 0);
    }

    public function test_si_la_api_no_elimina_el_registro_queda(): void
    {
        $this->actingAsRole('admin');
        $evento = $this->evento('batizado');
        Http::fake([self::API.'/batizado' => Http::response(['message' => 'Error message'], 500)]);

        $this->delete("/admin/eventos-prueba/{$evento->id}")
            ->assertSessionHas('error', 'Hostinger no eliminó el subdominio: Error message');

        $this->assertDatabaseHas('eventos_prueba', ['id' => $evento->id]);
    }

    public function test_un_evento_en_error_se_borra_sin_llamar_a_la_api(): void
    {
        $this->actingAsRole('admin');
        $evento = $this->evento('batizado', EventoPrueba::ERROR);
        Http::fake();

        $this->delete("/admin/eventos-prueba/{$evento->id}")->assertSessionHas('success');

        Http::assertNothingSent();
        $this->assertDatabaseCount('eventos_prueba', 0);
    }

    // ── Página pública del evento ───────────────────────────────────

    public function test_el_subdominio_muestra_el_evento_sin_sesion(): void
    {
        $this->evento('batizado');

        $this->get('http://batizado.gaiacapoeira.com/')
            ->assertOk()
            ->assertSee('Evento: Batizado');
    }

    public function test_un_subdominio_sin_evento_da_404(): void
    {
        $this->get('http://no-existe.gaiacapoeira.com/')->assertNotFound();
    }

    public function test_los_reservados_y_el_dominio_principal_siguen_en_el_sitio(): void
    {
        // Si existiera un registro con ese slug, igual no se atiende como evento.
        $this->evento('www');

        $this->get('http://www.gaiacapoeira.com/')->assertRedirect('/auth/login');
        $this->get('http://gaiacapoeira.com/')->assertRedirect('/auth/login');
        $this->get('http://gaiacapoeira.com/auth/login')->assertOk();
    }

    public function test_ruta_de_respaldo(): void
    {
        $this->evento('batizado');

        $this->get('/eventos-prueba/batizado')->assertOk()->assertSee('Evento: Batizado');
        $this->get('/eventos-prueba/no-existe')->assertNotFound();
    }

    public function test_el_nombre_se_escapa_en_la_pagina(): void
    {
        EventoPrueba::create(['nombre' => '<script>alert(1)</script>', 'slug' => 'script-alert-1', 'estado' => EventoPrueba::CREADO]);

        $this->get('/eventos-prueba/script-alert-1')
            ->assertOk()
            ->assertDontSee('<script>alert(1)</script>', false);
    }
}
