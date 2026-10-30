<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\EncuentroFoto;
use App\Models\Evento;
use App\Support\EncuentroCalendario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Encuentros, fase 5 (después del encuentro): terminar (página de recuerdo
 * con mensaje y fotos), quitar la página (borra el subdominio, archiva) y
 * volver a publicarla como recuerdo.
 */
class EncuentroRecuerdoTest extends TestCase
{
    use RefreshDatabase;

    private const PAGINA = 'http://batizado-2027.gaiacapoeira.com';

    private const API = 'https://developers.hostinger.com/api/hosting/v1/accounts/u000000000/websites/gaiacapoeira.com/subdomains*';

    private string $tmp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tmp = sys_get_temp_dir().DIRECTORY_SEPARATOR.'recuerdo-test-'.uniqid();
        config([
            'services.hostinger.token' => 'token-de-prueba',
            'services.hostinger.url' => 'https://developers.hostinger.com',
            'services.hostinger.username' => 'u000000000',
            'services.hostinger.domain' => 'gaiacapoeira.com',
            'logging.channels.hostinger.path' => $this->tmp.DIRECTORY_SEPARATOR.'hostinger.log',
            'filesystems.uploads_root' => $this->tmp.DIRECTORY_SEPARATOR.'uploads',
        ]);
        Carbon::setTestNow('2027-05-10 12:00:00');
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->tmp);

        parent::tearDown();
    }

    private function encuentro(array $attrs = []): Encuentro
    {
        $encuentro = Encuentro::factory()->publicado()->conPrecio()->create([
            'slug' => 'batizado-2027', 'subdominio' => 'creado', ...$attrs,
        ]);
        EncuentroCalendario::sync($encuentro);

        return $encuentro;
    }

    private function archivo(string $url): string
    {
        return $this->tmp.DIRECTORY_SEPARATOR.'uploads'.str_replace('/', DIRECTORY_SEPARATOR, substr($url, strlen('/uploads')));
    }

    public function test_terminar_deja_la_pagina_como_recuerdo(): void
    {
        $encuentro = $this->encuentro(['mensaje_final' => '¡Gracias!', 'traducciones' => ['pt' => ['mensaje_final' => 'Obrigado!']]]);
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}/terminar")->assertSessionHas('success');
        $this->assertSame(Encuentro::TERMINADO, $encuentro->fresh()?->estado);
        // Queda en el calendario como historia.
        $this->assertSame(1, Evento::count());

        $this->get(self::PAGINA.'/?lang=pt')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('encuentro.estado', 'terminado')
            ->where('encuentro.mensaje_final', 'Obrigado!'));
        $this->post(self::PAGINA.'/inscripcion', ['nombre' => 'Ana'])->assertSessionHasErrors('nombre');

        // Deshacer: vuelve a inscripciones cerradas.
        $this->post("/encuentros/{$encuentro->id}/terminar");
        $this->assertSame(Encuentro::CERRADO, $encuentro->fresh()?->estado);
    }

    public function test_un_borrador_no_se_termina(): void
    {
        $encuentro = $this->encuentro(['estado' => Encuentro::BORRADOR]);
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}/terminar")->assertSessionHas('error');
        $this->assertSame(Encuentro::BORRADOR, $encuentro->fresh()?->estado);
    }

    public function test_quitar_la_pagina_y_volver_a_publicarla(): void
    {
        $encuentro = $this->encuentro(['estado' => Encuentro::TERMINADO]);
        $encuentro->inscripciones()->create([
            'codigo' => 'AAAA-BBBB', 'token' => str_repeat('a', 48), 'nombre' => 'Ana', 'grupo' => 'Gaia',
            'ciudad' => 'Medellín', 'telefono' => '3001234567', 'emergencia_nombre' => 'Luis',
            'emergencia_telefono' => '3007654321', 'precio_nombre' => 'Tres días', 'precio_valor' => 150000,
            'consentimiento_at' => now(),
        ]);
        $this->actingAsRole('admin');
        Http::fake([self::API => Http::response(['message' => 'Request accepted'])]);

        $this->post("/encuentros/{$encuentro->id}/archivar")->assertSessionHas('success');

        Http::assertSent(fn (Request $r) => $r->method() === 'DELETE' && str_ends_with($r->url(), '/subdomains/batizado-2027'));
        $encuentro->refresh();
        $this->assertSame(Encuentro::ARCHIVADO, $encuentro->estado);
        $this->assertSame('ninguno', $encuentro->subdominio);
        $this->assertSame(1, $encuentro->inscripciones()->count());
        // La página y el enlace privado dejan de verse.
        auth()->logout();
        $this->get(self::PAGINA.'/')->assertNotFound();
        $this->get(self::PAGINA.'/inscripcion/'.str_repeat('a', 48))->assertNotFound();

        $this->actingAsRole('admin');
        $this->post("/encuentros/{$encuentro->id}/restaurar")->assertSessionHas('success');
        Http::assertSent(fn (Request $r) => $r->method() === 'POST' && $r['subdomain'] === 'batizado-2027');
        $this->assertSame(Encuentro::TERMINADO, $encuentro->fresh()?->estado);
        $this->assertSame('creado', $encuentro->fresh()?->subdominio);
    }

    public function test_si_hostinger_falla_no_se_archiva(): void
    {
        $encuentro = $this->encuentro(['estado' => Encuentro::TERMINADO]);
        $this->actingAsRole('admin');
        Http::fake([self::API => Http::response(['message' => 'Error'], 500)]);

        $this->post("/encuentros/{$encuentro->id}/archivar")->assertSessionHas('error');

        $this->assertSame(Encuentro::TERMINADO, $encuentro->fresh()?->estado);
        $this->assertSame('creado', $encuentro->fresh()?->subdominio);
    }

    public function test_solo_se_archiva_un_encuentro_terminado(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');
        Http::fake();

        $this->post("/encuentros/{$encuentro->id}/archivar")->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_fotos_se_achican_y_se_ven_en_la_pagina(): void
    {
        $encuentro = $this->encuentro(['estado' => Encuentro::TERMINADO]);
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}/fotos", [
            'fotos' => [UploadedFile::fake()->image('roda.jpg', 3000, 1500), UploadedFile::fake()->image('batizado.png', 800, 600)],
        ])->assertSessionHas('success', '2 fotos agregadas.');

        [$grande, $chica] = $encuentro->fotos()->get()->all();
        $this->assertSame([2000, 1000], array_slice((array) getimagesize($this->archivo($grande->foto_url)), 0, 2));
        $this->assertSame([480, 240], array_slice((array) getimagesize($this->archivo($grande->miniatura_url)), 0, 2));
        // Una chica no se agranda.
        $this->assertSame([800, 600], array_slice((array) getimagesize($this->archivo($chica->foto_url)), 0, 2));

        auth()->logout();
        $this->get(self::PAGINA.'/')->assertInertia(fn (Assert $page) => $page
            ->has('encuentro.fotos', 2)
            ->where('encuentro.fotos.0.miniatura', "/fotos/{$grande->id}/mini"));
        $this->get(self::PAGINA."/fotos/{$grande->id}")->assertOk();
        $this->get(self::PAGINA."/fotos/{$grande->id}/mini")->assertOk();
        $this->get('http://otro-encuentro.gaiacapoeira.com/fotos/'.$grande->id)->assertNotFound();
    }

    public function test_validaciones_y_borrado_de_fotos(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}/fotos", ['fotos' => [UploadedFile::fake()->create('virus.php', 5, 'application/x-php')]])
            ->assertSessionHasErrors('fotos.0');
        $this->post("/encuentros/{$encuentro->id}/fotos", ['fotos' => array_map(fn ($i) => UploadedFile::fake()->image("f{$i}.jpg"), range(1, 11))])
            ->assertSessionHasErrors('fotos');

        $this->post("/encuentros/{$encuentro->id}/fotos", ['fotos' => [UploadedFile::fake()->image('roda.jpg', 600, 400)]]);
        $foto = EncuentroFoto::sole();
        $this->delete("/encuentros/{$encuentro->id}/fotos/{$foto->id}")->assertSessionHas('success');

        $this->assertDatabaseCount('encuentro_fotos', 0);
        $this->assertFileDoesNotExist($this->archivo($foto->foto_url));
        $this->assertFileDoesNotExist($this->archivo($foto->miniatura_url));
    }

    public function test_un_miembro_no_gestiona_fotos_ni_estados(): void
    {
        $encuentro = $this->encuentro();
        $this->actingAsRole('member');

        $this->get("/encuentros/{$encuentro->id}/fotos")->assertForbidden();
        $this->post("/encuentros/{$encuentro->id}/fotos", ['fotos' => [UploadedFile::fake()->image('a.jpg')]])->assertForbidden();
        $this->post("/encuentros/{$encuentro->id}/terminar")->assertForbidden();
        $this->post("/encuentros/{$encuentro->id}/archivar")->assertForbidden();
    }
}
