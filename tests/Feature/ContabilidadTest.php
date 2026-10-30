<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\EncuentroMovimiento;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Encuentros, fase 6: contabilidad (pagos confirmados de las inscripciones
 * + gastos y otros ingresos anotados a mano, con comprobante opcional).
 */
class ContabilidadTest extends TestCase
{
    use RefreshDatabase;

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.'contabilidad-test-'.uniqid();
        config(['filesystems.uploads_root' => $this->tmp]);
        Carbon::setTestNow('2027-05-10 12:00:00');
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tmp);

        parent::tearDown();
    }

    private function inscripcion(Encuentro $encuentro, string $estado = Inscripcion::ACTIVA): Inscripcion
    {
        return $encuentro->inscripciones()->create([
            'codigo' => Inscripcion::nuevoCodigo(), 'token' => Inscripcion::nuevoToken(), 'nombre' => 'Ana',
            'grupo' => 'Gaia', 'ciudad' => 'Medellín', 'telefono' => '3001234567', 'emergencia_nombre' => 'Luis',
            'emergencia_telefono' => '3007654321', 'precio_nombre' => 'Tres días', 'precio_valor' => 150000,
            'consentimiento_at' => now(), 'estado' => $estado,
        ]);
    }

    private function pago(Inscripcion $inscripcion, int $monto, string $estado = InscripcionPago::CONFIRMADO, ?string $metodo = 'Nequi'): void
    {
        $inscripcion->pagos()->create([
            'monto' => $monto, 'fecha' => '2027-05-01', 'metodo' => $metodo, 'estado' => $estado, 'origen' => 'organizador',
        ]);
        $inscripcion->recalcularPago();
    }

    /** @return array<string, mixed> */
    private function gasto(array $extra = []): array
    {
        return [
            'tipo' => 'gasto', 'fecha' => '2027-05-05', 'concepto' => 'Alquiler del coliseo',
            'categoria' => 'Lugar', 'monto' => 80000, 'metodo' => 'Efectivo', ...$extra,
        ];
    }

    public function test_resumen_con_inscripciones_gastos_e_ingresos(): void
    {
        $encuentro = Encuentro::factory()->publicado()->create();
        $ana = $this->inscripcion($encuentro);
        $this->pago($ana, 100000);
        $this->pago($ana, 30000, InscripcionPago::REPORTADO);
        // Cancelada después de pagar: la plata entró igual.
        $this->pago($this->inscripcion($encuentro, Inscripcion::CANCELADA), 50000, metodo: null);
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto())->assertSessionHas('success', 'Gasto anotado.');
        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto(['concepto' => 'Camisetas', 'categoria' => 'Camisetas y cordas', 'monto' => 120000, 'metodo' => 'Nequi']));
        $this->post("/encuentros/{$encuentro->id}/movimientos", [
            'tipo' => 'ingreso', 'fecha' => '2027-05-06', 'concepto' => 'Patrocinio', 'categoria' => 'Patrocinio', 'monto' => 70000, 'metodo' => 'Nequi',
        ])->assertSessionHas('success', 'Ingreso anotado.');

        $this->get("/encuentros/{$encuentro->id}/contabilidad")->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('encuentros/contabilidad')
            ->where('resumen.inscripciones', 150000)
            ->where('resumen.pagos_count', 2)
            ->where('resumen.otros_ingresos', 70000)
            ->where('resumen.gastos', 200000)
            ->where('resumen.balance', 20000)
            // Solo la inscripción activa: 150.000 - 100.000.
            ->where('resumen.por_cobrar', 50000)
            ->where('resumen.por_revisar', 30000)
            ->where('resumen.gastos_por_categoria.0', ['categoria' => 'Camisetas y cordas', 'total' => 120000])
            ->where('resumen.por_metodo', [
                ['metodo' => 'Nequi', 'ingresos' => 170000, 'gastos' => 120000, 'neto' => 50000],
                ['metodo' => 'Sin indicar', 'ingresos' => 50000, 'gastos' => 0, 'neto' => 50000],
                ['metodo' => 'Efectivo', 'ingresos' => 0, 'gastos' => 80000, 'neto' => -80000],
            ])
            ->has('movimientos', 3));
    }

    public function test_validaciones(): void
    {
        $encuentro = Encuentro::factory()->create();
        $this->actingAsRole('admin');
        $url = "/encuentros/{$encuentro->id}/movimientos";

        $this->post($url, $this->gasto(['monto' => 0]))->assertSessionHasErrors('monto');
        $this->post($url, $this->gasto(['concepto' => '']))->assertSessionHasErrors('concepto');
        // La categoría tiene que ser del tipo: "Patrocinio" no es un gasto.
        $this->post($url, $this->gasto(['categoria' => 'Patrocinio']))->assertSessionHasErrors('categoria');
        $this->post($url, $this->gasto(['tipo' => 'prestamo']))->assertSessionHasErrors('tipo');
        $this->post($url, $this->gasto(['comprobante' => UploadedFile::fake()->create('virus.php', 5, 'application/x-php')]))
            ->assertSessionHasErrors('comprobante');

        $this->assertDatabaseCount('encuentro_movimientos', 0);
    }

    public function test_editar_y_eliminar_con_comprobante(): void
    {
        $encuentro = Encuentro::factory()->create();
        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto(['comprobante' => UploadedFile::fake()->image('factura.jpg')]));
        $movimiento = EncuentroMovimiento::sole();
        $archivo = $this->tmp.str_replace('/', DIRECTORY_SEPARATOR, substr((string) $movimiento->comprobante_url, strlen('/uploads')));
        $this->assertFileExists($archivo);
        $this->assertStringStartsWith('/uploads/comprobantes/', (string) $movimiento->comprobante_url);

        $this->get("/encuentros/{$encuentro->id}/movimientos/{$movimiento->id}/comprobante")->assertOk();

        $this->post("/encuentros/{$encuentro->id}/movimientos/{$movimiento->id}", [
            '_method' => 'put', ...$this->gasto(['monto' => 90000]), 'quitar_comprobante' => '1',
        ])->assertSessionHas('success');
        $this->assertSame(90000, $movimiento->fresh()?->monto);
        $this->assertNull($movimiento->fresh()?->comprobante_url);
        $this->assertFileDoesNotExist($archivo);

        $this->delete("/encuentros/{$encuentro->id}/movimientos/{$movimiento->id}")->assertSessionHas('success');
        $this->assertDatabaseCount('encuentro_movimientos', 0);
    }

    public function test_no_se_toca_un_movimiento_de_otro_encuentro(): void
    {
        $encuentro = Encuentro::factory()->create();
        $otro = Encuentro::factory()->create();
        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto());
        $movimiento = EncuentroMovimiento::sole();

        $this->delete("/encuentros/{$otro->id}/movimientos/{$movimiento->id}")->assertNotFound();
        $this->get("/encuentros/{$otro->id}/movimientos/{$movimiento->id}/comprobante")->assertNotFound();
        $this->assertDatabaseCount('encuentro_movimientos', 1);
    }

    public function test_exportar_libro_para_excel(): void
    {
        $encuentro = Encuentro::factory()->create(['slug' => 'batizado-2027']);
        $this->pago($this->inscripcion($encuentro), 100000);
        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto());

        $csv = $this->get("/encuentros/{$encuentro->id}/contabilidad/exportar")->assertOk()->streamedContent();

        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('Fecha;Tipo;Categoría;Concepto;Método;Ingreso;Gasto;Nota;Comprobante', $csv);
        $this->assertStringContainsString('2027-05-01;Ingreso;Inscripciones;', $csv);
        $this->assertStringContainsString('2027-05-05;Gasto;Lugar;"Alquiler del coliseo";Efectivo;;80000;;No', $csv);
        $this->assertStringContainsString(';;;Totales;;100000;80000;;', $csv);
        $this->assertStringContainsString(';;;Balance;;20000;;;', $csv);
    }

    public function test_un_miembro_no_ve_la_contabilidad(): void
    {
        $encuentro = Encuentro::factory()->create();
        $this->actingAsRole('member');

        $this->get("/encuentros/{$encuentro->id}/contabilidad")->assertForbidden();
        $this->get("/encuentros/{$encuentro->id}/contabilidad/exportar")->assertForbidden();
        $this->post("/encuentros/{$encuentro->id}/movimientos", $this->gasto())->assertForbidden();
    }
}
