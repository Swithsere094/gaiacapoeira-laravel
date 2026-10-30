<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Lo público de un encuentro (página e inscripción sin cuenta) y la gestión
 * de las inscripciones (pagos y exportar).
 */
class InscripcionesTest extends TestCase
{
    use RefreshDatabase;

    private const PAGINA = 'http://batizado-2027.gaiacapoeira.com';

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.hostinger.domain' => 'gaiacapoeira.com']);
        Carbon::setTestNow('2027-05-10 12:00:00');
    }

    private function encuentro(array $attrs = []): Encuentro
    {
        return Encuentro::factory()->publicado()->conPrecio()->create(['slug' => 'batizado-2027', ...$attrs]);
    }

    /** @return array<string, mixed> */
    private function datos(Encuentro $encuentro, array $extra = []): array
    {
        return [
            'nombre' => 'Ana Restrepo',
            'apelido' => 'Borboleta',
            'grupo' => 'Gaia Capoeira',
            'profesor' => 'Instrutor Pedro',
            'graduacion' => 'Corda azul',
            'ciudad' => 'Medellín',
            'telefono' => '+57 300 123 4567',
            'email' => 'ana@example.com',
            'talla' => 'M',
            'corte' => 'femenino',
            'emergencia_nombre' => 'Luis Restrepo',
            'emergencia_telefono' => '3007654321',
            'precio_id' => $encuentro->precios()->value('id'),
            'consentimiento' => true,
            ...$extra,
        ];
    }

    private function inscribir(Encuentro $encuentro, array $extra = []): Inscripcion
    {
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, $extra));

        return Inscripcion::latest()->firstOrFail();
    }

    // ── Página pública ──────────────────────────────────────────────

    public function test_la_pagina_se_ve_sin_sesion_y_no_se_indexa(): void
    {
        $this->encuentro(['nombre' => 'Batizado 2027']);

        $this->get(self::PAGINA.'/')
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
            ->assertInertia(fn (Assert $page) => $page
                ->component('encuentros/publico')
                ->where('encuentro.nombre', 'Batizado 2027')
                ->where('encuentro.base', '')
                ->where('cierre', null)
                ->has('encuentro.precios', 1));
    }

    public function test_un_borrador_no_se_ve_salvo_en_vista_previa(): void
    {
        $this->encuentro(['estado' => Encuentro::BORRADOR]);

        $this->get(self::PAGINA.'/')->assertNotFound();
        $this->get('/e/batizado-2027')->assertNotFound();

        $this->actingAsRole('admin');
        $this->get('/e/batizado-2027')->assertOk()->assertInertia(fn (Assert $page) => $page->where('encuentro.base', '/e/batizado-2027'));
    }

    public function test_subdominio_inexistente_y_reservados(): void
    {
        $this->get('http://no-existe.gaiacapoeira.com/')->assertNotFound();
        $this->get('http://www.gaiacapoeira.com/')->assertRedirect('/auth/login');
    }

    // ── Inscribirse ─────────────────────────────────────────────────

    public function test_inscripcion_completa(): void
    {
        $encuentro = $this->encuentro();

        $response = $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro));

        $inscripcion = Inscripcion::sole();
        $response->assertRedirect("/inscripcion/{$inscripcion->token}");
        $this->assertMatchesRegularExpression('/^[A-Z2-9]{4}-[A-Z2-9]{4}$/', $inscripcion->codigo);
        $this->assertSame('Tres días', $inscripcion->precio_nombre);
        $this->assertSame(150000, $inscripcion->precio_valor);
        $this->assertSame('pendiente', $inscripcion->pago_estado);
        $this->assertNotNull($inscripcion->consentimiento_at);

        $this->get(self::PAGINA."/inscripcion/{$inscripcion->token}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('encuentros/inscripcion')
                ->where('inscripcion.codigo', $inscripcion->codigo)
                ->where('inscripcion.saldo', 150000));
    }

    public function test_la_opcion_elegida_queda_copiada(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);

        $encuentro->precios()->delete();

        $this->assertSame('Tres días', $inscripcion->fresh()?->precio_nombre);
    }

    public function test_validaciones(): void
    {
        $encuentro = $this->encuentro();
        $otro = Encuentro::factory()->publicado()->conPrecio()->create();

        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['consentimiento' => false]))->assertSessionHasErrors('consentimiento');
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['precio_id' => $otro->precios()->value('id')]))->assertSessionHasErrors('precio_id');
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['telefono' => 'llámame']))->assertSessionHasErrors('telefono');
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['grupo' => '']))->assertSessionHasErrors('grupo');

        $this->assertDatabaseCount('inscripciones', 0);
    }

    public function test_la_trampa_para_bots_no_guarda_nada(): void
    {
        $encuentro = $this->encuentro();

        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['sitio_web' => 'http://spam.example']))->assertRedirect('/');

        $this->assertDatabaseCount('inscripciones', 0);
    }

    public function test_cerradas_por_estado_fechas_o_cupo(): void
    {
        $cerrado = $this->encuentro(['estado' => Encuentro::CERRADO]);
        $this->post(self::PAGINA.'/inscripcion', $this->datos($cerrado))->assertSessionHasErrors('nombre');
        $cerrado->delete();

        $antes = $this->encuentro(['inscripciones_desde' => '2027-06-01']);
        $this->get(self::PAGINA.'/')->assertInertia(fn (Assert $page) => $page->where('cierre', 'antes'));
        $this->post(self::PAGINA.'/inscripcion', $this->datos($antes))->assertSessionHasErrors('nombre');
        $antes->delete();

        $despues = $this->encuentro(['inscripciones_hasta' => '2027-05-09']);
        $this->post(self::PAGINA.'/inscripcion', $this->datos($despues))->assertSessionHasErrors('nombre');
        $despues->delete();

        $lleno = $this->encuentro(['cupo' => 1]);
        $this->inscribir($lleno);
        $this->post(self::PAGINA.'/inscripcion', $this->datos($lleno))->assertSessionHasErrors('nombre');
        $this->get(self::PAGINA.'/')->assertInertia(fn (Assert $page) => $page->where('cierre', 'cupo'));
        $this->assertSame(1, Inscripcion::count());
    }

    public function test_el_ultimo_dia_de_inscripcion_cuenta(): void
    {
        $encuentro = $this->encuentro(['inscripciones_hasta' => '2027-05-10']);

        $this->inscribir($encuentro);

        $this->assertDatabaseCount('inscripciones', 1);
    }

    public function test_limite_de_inscripciones_por_conexion(): void
    {
        $encuentro = $this->encuentro();

        for ($i = 0; $i < 10; $i++) {
            $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['nombre' => "Persona {$i}"]));
        }
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro))->assertSessionHasErrors('nombre');

        $this->assertDatabaseCount('inscripciones', 10);
    }

    public function test_el_enlace_privado_es_del_encuentro(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        Encuentro::factory()->publicado()->create(['slug' => 'otro-encuentro']);

        $this->get(self::PAGINA.'/inscripcion/'.str_repeat('x', 48))->assertNotFound();
        $this->get("http://otro-encuentro.gaiacapoeira.com/inscripcion/{$inscripcion->token}")->assertNotFound();
    }

    public function test_corte_de_la_camiseta(): void
    {
        $encuentro = $this->encuentro();

        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['corte' => '']))->assertSessionHasErrors('corte');
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['corte' => 'unisex']))->assertSessionHasErrors('corte');
        // Sin talla no hace falta el corte.
        $this->inscribir($encuentro, ['talla' => '', 'corte' => '']);
        $this->inscribir($encuentro, ['corte' => 'masculino']);
        $this->inscribir($encuentro, ['nombre' => 'Otra persona']);

        $this->assertSame('masculino', Inscripcion::where('corte', 'masculino')->value('corte'));
        $this->actingAsRole('admin');
        $this->get("/encuentros/{$encuentro->id}")->assertInertia(fn (Assert $page) => $page
            ->where('resumen.camisetas', [
                ['corte' => 'masculino', 'talla' => 'M', 'cantidad' => 1],
                ['corte' => 'femenino', 'talla' => 'M', 'cantidad' => 1],
            ]));
    }

    // ── Gestión de inscripciones ────────────────────────────────────

    public function test_el_organizador_agrega_notas_y_cancela(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('admin');

        $this->put("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}", [
            'estado' => 'cancelada', 'notas' => 'Avisó que no puede ir',
        ])->assertSessionHas('success');

        $inscripcion->refresh();
        $this->assertSame('cancelada', $inscripcion->estado);
        $this->assertSame('Avisó que no puede ir', $inscripcion->notas);
        $this->get("/encuentros/{$encuentro->id}")->assertInertia(fn (Assert $page) => $page->where('resumen.inscritos', 0));
    }

    public function test_no_se_toca_una_inscripcion_de_otro_encuentro(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $otro = Encuentro::factory()->create();
        $this->actingAsRole('admin');

        $this->put("/encuentros/{$otro->id}/inscripciones/{$inscripcion->id}", [
            'pago_estado' => 'pagado', 'monto_pagado' => 150000, 'estado' => 'activa',
        ])->assertNotFound();
    }

    public function test_un_miembro_no_ve_ni_toca_inscripciones(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('member');

        $this->get("/encuentros/{$encuentro->id}")->assertForbidden();
        $this->get("/encuentros/{$encuentro->id}/exportar")->assertForbidden();
        $this->put("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}", ['pago_estado' => 'pagado'])->assertForbidden();
    }

    public function test_exportar_para_excel(): void
    {
        $encuentro = $this->encuentro();
        $this->inscribir($encuentro);
        $this->actingAsRole('admin');

        $response = $this->get("/encuentros/{$encuentro->id}/exportar")->assertOk();
        $csv = $response->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('Código;Fecha;Nombre', $csv);
        $this->assertStringContainsString('"Ana Restrepo";Borboleta;"Gaia Capoeira"', $csv);
        $this->assertStringContainsString('Asistió', $csv);
        $this->assertStringContainsString(';M;femenino;', $csv);
        $this->assertStringContainsString('attachment; filename=batizado-2027-inscripciones-', (string) $response->headers->get('Content-Disposition'));
    }
}
