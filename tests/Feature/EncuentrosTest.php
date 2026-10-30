<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\Evento;
use App\Models\Inscripcion;
use App\Models\Permission;
use App\Models\Role;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Gestión de encuentros (permiso `encuentros.gestionar`): crear, editar,
 * publicar (subdominio con la API de Hostinger, simulada con Http::fake),
 * calendario y eliminar.
 */
class EncuentrosTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'token-secreto-de-prueba';

    private const API = 'https://developers.hostinger.com/api/hosting/v1/accounts/u000000000/websites/gaiacapoeira.com/subdomains';

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.'encuentros-test-'.uniqid();

        config([
            'services.hostinger.token' => self::TOKEN,
            'services.hostinger.url' => 'https://developers.hostinger.com',
            'services.hostinger.username' => 'u000000000',
            'services.hostinger.domain' => 'gaiacapoeira.com',
            'logging.channels.hostinger.path' => $this->tmp.DIRECTORY_SEPARATOR.'hostinger.log',
            'filesystems.uploads_root' => $this->tmp.DIRECTORY_SEPARATOR.'uploads',
        ]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tmp);

        parent::tearDown();
    }

    /** @return array<string, mixed> */
    private function datos(array $extra = []): array
    {
        return [
            'nombre' => 'Batizado 2027',
            'starts_on' => '2027-07-02',
            'ends_on' => '2027-07-04',
            'lugar' => 'Coliseo de Rionegro',
            'precios' => [
                ['nombre' => 'Tres días con camiseta', 'valor' => 180000],
                ['nombre' => 'Solo sábado', 'descripcion' => 'Sin camiseta', 'valor' => 60000],
            ],
            ...$extra,
        ];
    }

    // ── Acceso ──────────────────────────────────────────────────────

    public function test_sin_permiso_no_se_entra(): void
    {
        $this->get('/encuentros')->assertRedirect('/auth/login');

        $this->actingAsRole('member');
        $this->get('/encuentros')->assertForbidden();
        $this->post('/encuentros', $this->datos())->assertForbidden();
        $this->assertDatabaseCount('encuentros', 0);
    }

    public function test_un_rol_con_el_permiso_puede_gestionar(): void
    {
        $role = Role::create(['slug' => 'organizador', 'name' => 'Organizador']);
        $role->permissions()->attach(Permission::where('slug', Permissions::ENCUENTROS_GESTIONAR)->value('id'));
        $this->actingAsRole('organizador');

        $this->get('/encuentros')->assertOk()->assertInertia(fn (Assert $page) => $page->component('encuentros/index'));
    }

    // ── Crear y editar ──────────────────────────────────────────────

    public function test_crear_un_encuentro_como_borrador(): void
    {
        $this->actingAsRole('admin');

        $this->post('/encuentros', $this->datos())->assertRedirect();

        $encuentro = Encuentro::sole();
        $this->assertSame('batizado-2027', $encuentro->slug);
        $this->assertSame(Encuentro::BORRADOR, $encuentro->estado);
        $this->assertSame(['Tres días con camiseta', 'Solo sábado'], $encuentro->precios->pluck('nombre')->all());
        $this->assertSame(60000, $encuentro->precios[1]->valor);
    }

    public function test_direccion_reservada_o_repetida(): void
    {
        $this->actingAsRole('admin');
        Encuentro::factory()->create(['slug' => 'batizado-2027']);

        $this->post('/encuentros', $this->datos())->assertSessionHasErrors(['slug' => 'Ya hay un encuentro con esa dirección']);
        $this->post('/encuentros', $this->datos(['slug' => 'www']))->assertSessionHasErrors('slug');
        $this->assertDatabaseCount('encuentros', 1);
    }

    public function test_editar_sincroniza_las_opciones_de_precio(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->conPrecio()->create();
        $existente = $encuentro->precios()->sole();

        $this->put("/encuentros/{$encuentro->id}", $this->datos([
            'slug' => $encuentro->slug,
            'precios' => [
                ['id' => $existente->id, 'nombre' => 'Tres días (anticipado)', 'valor' => 140000],
                ['nombre' => 'Grupo de 5 (por persona)', 'valor' => 120000],
            ],
        ]))->assertRedirect("/encuentros/{$encuentro->id}");

        $precios = $encuentro->precios()->get();
        $this->assertCount(2, $precios);
        $this->assertSame($existente->id, $precios[0]->id);
        $this->assertSame(140000, $precios[0]->valor);
        $this->assertSame('Grupo de 5 (por persona)', $precios[1]->nombre);
    }

    public function test_la_portada_se_guarda_fuera_de_public(): void
    {
        $this->actingAsRole('admin');

        $this->post('/encuentros', $this->datos(['portada' => UploadedFile::fake()->image('portada.jpg', 900, 300)]))->assertRedirect();

        $url = (string) Encuentro::sole()->portada_url;
        $this->assertStringStartsWith('/uploads/encuentros/', $url);
        $this->assertFileExists($this->tmp.'/uploads/encuentros/'.basename($url));
    }

    public function test_la_direccion_no_cambia_despues_de_crear_el_subdominio(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->publicado()->conPrecio()->create(['slug' => 'batizado-2027']);

        $this->put("/encuentros/{$encuentro->id}", $this->datos(['slug' => 'otra-direccion']))->assertRedirect();

        $this->assertSame('batizado-2027', $encuentro->fresh()?->slug);
    }

    // ── Publicar ────────────────────────────────────────────────────

    public function test_publicar_crea_el_subdominio_y_lo_pone_en_el_calendario(): void
    {
        $user = $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->conPrecio()->create(['slug' => 'batizado-2027', 'nombre' => 'Batizado 2027', 'user_id' => $user->id]);
        Http::fake([self::API => Http::response(['message' => 'Request accepted'])]);

        $this->post("/encuentros/{$encuentro->id}/publicar")->assertSessionHas('success');

        $encuentro->refresh();
        $this->assertSame(Encuentro::PUBLICADO, $encuentro->estado);
        $this->assertSame('creado', $encuentro->subdominio);
        Http::assertSent(fn (Request $r) => $r->method() === 'POST'
            && $r->url() === self::API
            && $r->data() === ['subdomain' => 'batizado-2027', 'is_using_public_directory' => true]);

        $evento = Evento::findOrFail($encuentro->evento_id);
        $this->assertSame('Batizado 2027', $evento->title);
        $this->assertSame('2027-07-04', $evento->ends_on?->toDateString());
        $this->assertStringContainsString('https://batizado-2027.gaiacapoeira.com', (string) $evento->description);

        // El token nunca queda en el log.
        $this->assertStringNotContainsString(self::TOKEN, (string) file_get_contents($this->tmp.'/hostinger.log'));
    }

    public function test_no_se_publica_sin_opciones_de_precio(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->create();
        Http::fake();

        $this->post("/encuentros/{$encuentro->id}/publicar")->assertSessionHas('error');

        Http::assertNothingSent();
        $this->assertSame(Encuentro::BORRADOR, $encuentro->fresh()?->estado);
    }

    public function test_si_hostinger_falla_queda_en_borrador(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->conPrecio()->create();
        Http::fake([self::API => Http::response(['message' => 'Error message'], 500)]);

        $this->post("/encuentros/{$encuentro->id}/publicar")->assertSessionHas('error');

        $encuentro->refresh();
        $this->assertSame(Encuentro::BORRADOR, $encuentro->estado);
        $this->assertSame('error', $encuentro->subdominio);
        $this->assertNull($encuentro->evento_id);
    }

    public function test_volver_a_borrador_y_republicar_no_crea_otro_subdominio(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->publicado()->conPrecio()->create();
        $this->post("/encuentros/{$encuentro->id}/publicar");
        $this->assertNotNull($encuentro->fresh()?->evento_id);
        Http::fake();

        $this->post("/encuentros/{$encuentro->id}/despublicar")->assertSessionHas('success');
        $this->assertSame(Encuentro::BORRADOR, $encuentro->fresh()?->estado);
        $this->assertNull($encuentro->fresh()?->evento_id);
        $this->assertDatabaseCount('eventos', 0);

        $this->post("/encuentros/{$encuentro->id}/publicar")->assertSessionHas('success');
        Http::assertNothingSent();
        $this->assertSame(Encuentro::PUBLICADO, $encuentro->fresh()?->estado);
    }

    public function test_cerrar_y_reabrir_inscripciones(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->publicado()->create();

        $this->post("/encuentros/{$encuentro->id}/inscripciones-abiertas");
        $this->assertSame(Encuentro::CERRADO, $encuentro->fresh()?->estado);

        $this->post("/encuentros/{$encuentro->id}/inscripciones-abiertas");
        $this->assertSame(Encuentro::PUBLICADO, $encuentro->fresh()?->estado);
    }

    // ── Eliminar ────────────────────────────────────────────────────

    public function test_eliminar_borra_el_subdominio(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->publicado()->conPrecio()->create(['slug' => 'batizado-2027']);
        Http::fake([self::API.'/batizado-2027' => Http::response(['message' => 'Request accepted'])]);

        $this->delete("/encuentros/{$encuentro->id}")->assertRedirect('/encuentros');

        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && $r->url() === self::API.'/batizado-2027');
        $this->assertDatabaseCount('encuentros', 0);
    }

    public function test_no_se_elimina_con_inscripciones(): void
    {
        $this->actingAsRole('admin');
        $encuentro = Encuentro::factory()->publicado()->conPrecio()->create();
        $precio = $encuentro->precios()->sole();
        $encuentro->inscripciones()->create([
            'codigo' => Inscripcion::nuevoCodigo(), 'token' => Inscripcion::nuevoToken(),
            'nombre' => 'Ana', 'grupo' => 'Gaia', 'ciudad' => 'Rionegro', 'telefono' => '3001234567',
            'emergencia_nombre' => 'Luis', 'emergencia_telefono' => '3007654321',
            'precio_id' => $precio->id, 'precio_nombre' => $precio->nombre, 'precio_valor' => $precio->valor,
            'consentimiento_at' => now(),
        ]);
        Http::fake();

        $this->delete("/encuentros/{$encuentro->id}")->assertSessionHas('error');

        Http::assertNothingSent();
        $this->assertDatabaseCount('encuentros', 1);
    }
}
