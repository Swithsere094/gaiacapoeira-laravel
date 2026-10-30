<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\EncuentroInvitado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Encuentros, fase 3: programación por día, invitados con foto y dirección
 * para el mapa de la página pública.
 */
class EncuentroContenidoTest extends TestCase
{
    use RefreshDatabase;

    private const PAGINA = 'http://batizado-2027.gaiacapoeira.com';

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.'contenido-test-'.uniqid();
        config([
            'services.hostinger.domain' => 'gaiacapoeira.com',
            'filesystems.uploads_root' => $this->tmp,
        ]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tmp);

        parent::tearDown();
    }

    private function encuentro(): Encuentro
    {
        return Encuentro::factory()->publicado()->conPrecio()->create([
            'slug' => 'batizado-2027', 'starts_on' => '2027-07-02', 'ends_on' => '2027-07-04',
        ]);
    }

    /** @return array<string, mixed> */
    private function datos(Encuentro $encuentro, array $extra = []): array
    {
        return [
            '_method' => 'put',
            'nombre' => $encuentro->nombre,
            'starts_on' => '2027-07-02',
            'ends_on' => '2027-07-04',
            'precios' => $encuentro->precios->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'valor' => $p->valor])->all(),
            ...$extra,
        ];
    }

    private function foto(): UploadedFile
    {
        return UploadedFile::fake()->image('mestre.jpg', 300, 300);
    }

    public function test_programacion_por_dia_ordenada(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'direccion' => 'Calle 50 # 40-20, Rionegro',
            'actividades' => [
                ['fecha' => '2027-07-03', 'hora_inicio' => '15:00', 'hora_fin' => '18:00', 'titulo' => 'Batizado'],
                ['fecha' => '2027-07-02', 'hora_inicio' => '18:00', 'hora_fin' => '20:00', 'titulo' => 'Roda de apertura'],
                ['fecha' => '2027-07-02', 'titulo' => 'Llegada y registro', 'descripcion' => 'En la entrada'],
            ],
        ]))->assertSessionHasNoErrors()->assertRedirect("/encuentros/{$encuentro->id}");

        $this->get(self::PAGINA.'/')->assertInertia(fn (Assert $page) => $page
            ->where('encuentro.direccion', 'Calle 50 # 40-20, Rionegro')
            ->has('encuentro.actividades', 3)
            ->where('encuentro.actividades.0.titulo', 'Llegada y registro')
            ->where('encuentro.actividades.0.hora_inicio', null)
            ->where('encuentro.actividades.1.titulo', 'Roda de apertura')
            ->where('encuentro.actividades.1.hora_inicio', '18:00')
            ->where('encuentro.actividades.2.titulo', 'Batizado'));

        // Editar conserva la actividad (mismo id) y quitar la borra.
        $id = $encuentro->actividades()->where('titulo', 'Batizado')->value('id');
        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'actividades' => [['id' => $id, 'fecha' => '2027-07-04', 'titulo' => 'Batizado y troca']],
        ]))->assertSessionHasNoErrors();

        $this->assertSame(1, $encuentro->actividades()->count());
        $this->assertSame($id, $encuentro->actividades()->value('id'));
        $this->assertSame('Batizado y troca', $encuentro->actividades()->value('titulo'));
    }

    public function test_validaciones_de_la_programacion(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'actividades' => [['fecha' => '2027-07-10', 'titulo' => 'Fuera de fecha']],
        ]))->assertSessionHasErrors('actividades.0.fecha');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'actividades' => [['fecha' => '2027-07-02', 'hora_inicio' => '18:00', 'hora_fin' => '17:00', 'titulo' => 'Al revés']],
        ]))->assertSessionHasErrors('actividades.0.hora_fin');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'actividades' => [['fecha' => '2027-07-02', 'hora_fin' => '17:00', 'titulo' => 'Sin inicio']],
        ]))->assertSessionHasErrors('actividades.0.hora_inicio');

        $this->assertSame(0, $encuentro->actividades()->count());
    }

    public function test_invitados_con_foto(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'invitados' => [
                ['nombre' => 'Mestre Pelé', 'titulo' => 'Mestre', 'grupo' => 'Gaia Capoeira', 'foto' => $this->foto()],
                ['nombre' => 'Professora Ana'],
            ],
        ]))->assertSessionHasNoErrors();

        $mestre = EncuentroInvitado::where('nombre', 'Mestre Pelé')->firstOrFail();
        $this->assertNotNull($mestre->foto_url);

        // La página pública muestra la foto por su propia ruta, sin sesión.
        auth()->logout();
        $this->get(self::PAGINA.'/')->assertInertia(fn (Assert $page) => $page
            ->has('encuentro.invitados', 2)
            ->where('encuentro.invitados.0.foto', "/invitados/{$mestre->id}/foto")
            ->where('encuentro.invitados.1.foto', null));
        $this->get(self::PAGINA."/invitados/{$mestre->id}/foto")->assertOk();
        $this->get('http://otro.gaiacapoeira.com/invitados/'.$mestre->id.'/foto')->assertNotFound();
    }

    public function test_quitar_la_foto_o_al_invitado_borra_el_archivo(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'invitados' => [
                ['nombre' => 'Mestre Pelé', 'foto' => $this->foto()],
                ['nombre' => 'Contramestre João', 'foto' => $this->foto()],
            ],
        ]));
        [$pele, $joao] = $encuentro->invitados()->get()->all();
        $fotoPele = $this->tmp.substr((string) $pele->foto_url, strlen('/uploads'));
        $fotoJoao = $this->tmp.substr((string) $joao->foto_url, strlen('/uploads'));
        $this->assertFileExists($fotoPele);

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'invitados' => [['id' => $pele->id, 'nombre' => 'Mestre Pelé', 'quitar_foto' => '1']],
        ]))->assertSessionHasNoErrors();

        $this->assertNull($pele->fresh()?->foto_url);
        $this->assertFileDoesNotExist($fotoPele);
        $this->assertNull($joao->fresh());
        $this->assertFileDoesNotExist($fotoJoao);
    }

    public function test_la_foto_tiene_que_ser_imagen(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}", $this->datos($encuentro, [
            'invitados' => [['nombre' => 'Mestre Pelé', 'foto' => UploadedFile::fake()->create('virus.php', 10, 'application/x-php')]],
        ]))->assertSessionHasErrors('invitados.0.foto');
    }
}
