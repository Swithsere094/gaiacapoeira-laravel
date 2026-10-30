<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Encuentros, fase 2: historial de pagos (registrados por el organizador o
 * reportados por la persona con comprobante), comprobantes privados y
 * asistencia el día del encuentro.
 */
class PagosTest extends TestCase
{
    use RefreshDatabase;

    private const PAGINA = 'http://batizado-2027.gaiacapoeira.com';

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.'pagos-test-'.uniqid();
        config([
            'services.hostinger.domain' => 'gaiacapoeira.com',
            'filesystems.uploads_root' => $this->tmp,
        ]);
        Carbon::setTestNow('2027-05-10 12:00:00');
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tmp);

        parent::tearDown();
    }

    private function encuentro(): Encuentro
    {
        return Encuentro::factory()->publicado()->conPrecio(150000)->create(['slug' => 'batizado-2027']);
    }

    /** @return array<string, mixed> */
    private function datos(Encuentro $encuentro, array $extra = []): array
    {
        return [
            'nombre' => 'Ana Restrepo', 'grupo' => 'Gaia Capoeira', 'ciudad' => 'Medellín',
            'telefono' => '3001234567', 'emergencia_nombre' => 'Luis', 'emergencia_telefono' => '3007654321',
            'precio_id' => $encuentro->precios()->value('id'), 'consentimiento' => true,
            ...$extra,
        ];
    }

    private function inscribir(Encuentro $encuentro, array $extra = []): Inscripcion
    {
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, $extra));

        return Inscripcion::latest()->firstOrFail();
    }

    private function comprobante(): UploadedFile
    {
        return UploadedFile::fake()->image('comprobante.jpg', 400, 600);
    }

    // ── El organizador registra pagos ───────────────────────────────

    public function test_registrar_pagos_suma_y_cambia_el_estado(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('admin');
        $url = "/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/pagos";

        $this->post($url, ['monto' => 50000, 'fecha' => '2027-05-03', 'metodo' => 'Nequi'])->assertSessionHas('success');
        $inscripcion->refresh();
        $this->assertSame('parcial', $inscripcion->pago_estado);
        $this->assertSame(50000, $inscripcion->monto_pagado);

        $this->post($url, ['monto' => 100000, 'fecha' => '2027-05-10', 'metodo' => 'Efectivo', 'comprobante' => $this->comprobante()]);
        $inscripcion->refresh();
        $this->assertSame('pagado', $inscripcion->pago_estado);
        $this->assertSame(0, $inscripcion->saldo());
        $this->assertSame(2, $inscripcion->pagos()->where('estado', 'confirmado')->count());

        $this->get("/encuentros/{$encuentro->id}")->assertInertia(fn (Assert $page) => $page
            ->where('resumen.pagados', 1)
            ->where('resumen.recaudado', 150000)
            ->has('inscripciones.0.pagos', 2));
    }

    public function test_quitar_un_pago_recalcula(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/pagos", ['monto' => 150000, 'fecha' => '2027-05-10']);
        $pago = InscripcionPago::sole();

        $this->delete("/encuentros/{$encuentro->id}/pagos/{$pago->id}")->assertSessionHas('success');

        $this->assertSame('pendiente', $inscripcion->fresh()?->pago_estado);
        $this->assertDatabaseCount('inscripcion_pagos', 0);
    }

    // ── La persona reporta pagos ────────────────────────────────────

    public function test_ya_pague_al_inscribirse_queda_por_revisar(): void
    {
        $encuentro = $this->encuentro();

        $inscripcion = $this->inscribir($encuentro, [
            'ya_pague' => true, 'pago_monto' => 80000, 'pago_metodo' => 'Nequi', 'pago_comprobante' => $this->comprobante(),
        ]);

        $pago = $inscripcion->pagos()->sole();
        $this->assertSame(InscripcionPago::REPORTADO, $pago->estado);
        $this->assertSame('participante', $pago->origen);
        $this->assertStringStartsWith('/uploads/comprobantes/', (string) $pago->comprobante_url);
        // No suma hasta que lo confirmen.
        $this->assertSame('pendiente', $inscripcion->pago_estado);
        $this->assertSame(0, $inscripcion->monto_pagado);
    }

    public function test_ya_pague_exige_comprobante(): void
    {
        $encuentro = $this->encuentro();

        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['ya_pague' => true, 'pago_monto' => 80000]))
            ->assertSessionHasErrors('pago_comprobante');

        $this->assertDatabaseCount('inscripciones', 0);
    }

    public function test_reportar_un_pago_despues_desde_el_enlace(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);

        $this->post(self::PAGINA."/inscripcion/{$inscripcion->token}/pago", ['monto' => 150000])->assertSessionHasErrors('comprobante');
        $this->post(self::PAGINA."/inscripcion/{$inscripcion->token}/pago", ['monto' => 150000, 'comprobante' => $this->comprobante()])
            ->assertSessionHas('success');

        $this->assertSame(InscripcionPago::REPORTADO, $inscripcion->pagos()->sole()->estado);
        $this->get(self::PAGINA."/inscripcion/{$inscripcion->token}")->assertInertia(fn (Assert $page) => $page
            ->where('inscripcion.pagos.0.estado', 'reportado')
            ->missing('inscripcion.pagos.0.comprobante'));
    }

    public function test_confirmar_y_rechazar_lo_reportado(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro, [
            'ya_pague' => true, 'pago_monto' => 150000, 'pago_comprobante' => $this->comprobante(),
        ]);
        $pago = $inscripcion->pagos()->sole();
        $this->actingAsRole('admin');
        $this->get("/encuentros/{$encuentro->id}")->assertInertia(fn (Assert $page) => $page->where('resumen.por_revisar', 1));

        $this->post("/encuentros/{$encuentro->id}/pagos/{$pago->id}/confirmar")->assertSessionHas('success');
        $this->assertSame('pagado', $inscripcion->fresh()?->pago_estado);

        $this->post("/encuentros/{$encuentro->id}/pagos/{$pago->id}/rechazar")->assertSessionHas('success');
        $this->assertSame('pendiente', $inscripcion->fresh()?->pago_estado);
        $this->assertSame(InscripcionPago::RECHAZADO, $pago->fresh()?->estado);
    }

    // ── Comprobantes privados ───────────────────────────────────────

    public function test_los_comprobantes_solo_los_ve_quien_gestiona(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro, [
            'ya_pague' => true, 'pago_monto' => 50000, 'pago_comprobante' => $this->comprobante(),
        ]);
        $pago = $inscripcion->pagos()->sole();
        $archivo = substr((string) $pago->comprobante_url, strlen('/uploads/'));

        // Un miembro con sesión no lo baja por la ruta general de subidas…
        $this->actingAsRole('member');
        $this->get('/uploads/'.$archivo)->assertNotFound();
        File::ensureDirectoryExists($this->tmp.'/politica');
        $this->get('/uploads/politica/../'.$archivo)->assertNotFound();
        $this->get("/encuentros/{$encuentro->id}/pagos/{$pago->id}/comprobante")->assertForbidden();

        // …el organizador sí, por la ruta del encuentro.
        $this->actingAsRole('admin');
        $this->get("/encuentros/{$encuentro->id}/pagos/{$pago->id}/comprobante")->assertOk();
        $otro = Encuentro::factory()->create();
        $this->get("/encuentros/{$otro->id}/pagos/{$pago->id}/comprobante")->assertNotFound();
    }

    // ── Asistencia ──────────────────────────────────────────────────

    public function test_marcar_asistencia(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('admin');

        $this->get("/encuentros/{$encuentro->id}/asistencia")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('encuentros/asistencia')
            ->where('inscripciones.0.asistio', false)
            ->where('inscripciones.0.saldo', 150000));

        $this->post("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/asistencia");
        $this->assertNotNull($inscripcion->fresh()?->asistio_at);

        $this->post("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/asistencia");
        $this->assertNull($inscripcion->fresh()?->asistio_at);
    }

    public function test_un_miembro_no_registra_pagos_ni_asistencia(): void
    {
        $encuentro = $this->encuentro();
        $inscripcion = $this->inscribir($encuentro);
        $this->actingAsRole('member');

        $this->post("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/pagos", ['monto' => 1, 'fecha' => '2027-05-10'])->assertForbidden();
        $this->post("/encuentros/{$encuentro->id}/inscripciones/{$inscripcion->id}/asistencia")->assertForbidden();
        $this->get("/encuentros/{$encuentro->id}/asistencia")->assertForbidden();
    }
}
