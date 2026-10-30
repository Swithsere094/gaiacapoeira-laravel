<?php

namespace Tests\Feature;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Encuentros, fase 4: páginas públicas en español, portugués e inglés
 * (textos de la interfaz en lang/{es,pt,en}/encuentro.php) y traducciones
 * opcionales de lo que escribe el organizador.
 */
class EncuentroIdiomasTest extends TestCase
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
            'nombre' => 'Ana Restrepo', 'grupo' => 'Gaia Capoeira', 'ciudad' => 'Medellín',
            'telefono' => '3001234567', 'emergencia_nombre' => 'Luis', 'emergencia_telefono' => '3007654321',
            'precio_id' => $encuentro->precios()->value('id'), 'consentimiento' => true,
            ...$extra,
        ];
    }

    public function test_los_tres_idiomas_tienen_las_mismas_claves(): void
    {
        $claves = fn (string $locale) => array_keys(Arr::dot(require lang_path("{$locale}/encuentro.php")));
        $es = $claves('es');

        foreach (['pt', 'en'] as $locale) {
            $this->assertSame([], array_values(array_diff($es, $claves($locale))), "Faltan en {$locale}");
            $this->assertSame([], array_values(array_diff($claves($locale), $es)), "Sobran en {$locale}");
        }
    }

    public function test_idioma_por_defecto_navegador_y_eleccion(): void
    {
        $this->encuentro();

        // Navegador en un idioma que no está: español.
        $this->get(self::PAGINA.'/', ['Accept-Language' => 'fr-FR,fr'])->assertInertia(fn (Assert $page) => $page
            ->where('idioma.actual', 'es')
            ->where('idioma.textos.inscribete', 'Inscríbete'));

        $this->get(self::PAGINA.'/', ['Accept-Language' => 'pt-BR,pt;q=0.9'])
            ->assertInertia(fn (Assert $page) => $page
                ->where('idioma.actual', 'pt')
                ->where('idioma.textos.inscribete', 'Inscreva-se'));

        // Elegido a mano: se recuerda aunque el navegador diga otra cosa.
        $this->get(self::PAGINA.'/?lang=en')->assertInertia(fn (Assert $page) => $page->where('idioma.actual', 'en'));
        $this->get(self::PAGINA.'/', ['Accept-Language' => 'pt'])->assertInertia(fn (Assert $page) => $page->where('idioma.actual', 'en'));

        // Un idioma desconocido no cambia nada.
        $this->get(self::PAGINA.'/?lang=fr')->assertInertia(fn (Assert $page) => $page->where('idioma.actual', 'en'));
    }

    public function test_contenido_traducido_con_respaldo_en_espanol(): void
    {
        $encuentro = $this->encuentro([
            'nombre' => 'Batizado 2027',
            'descripcion' => 'Tres días de capoeira',
            'traducciones' => ['pt' => ['nombre' => 'Batizado 2027 (PT)']],
        ]);
        $encuentro->actividades()->create([
            'fecha' => $encuentro->starts_on->toDateString(), 'titulo' => 'Roda de apertura',
            'traducciones' => ['en' => ['titulo' => 'Opening roda']],
        ]);

        $this->get(self::PAGINA.'/?lang=pt')->assertInertia(fn (Assert $page) => $page
            ->where('encuentro.nombre', 'Batizado 2027 (PT)')
            // Sin traducir: en español.
            ->where('encuentro.descripcion', 'Tres días de capoeira')
            ->where('encuentro.actividades.0.titulo', 'Roda de apertura'));

        $this->get(self::PAGINA.'/?lang=en')->assertInertia(fn (Assert $page) => $page
            ->where('encuentro.nombre', 'Batizado 2027')
            ->where('encuentro.actividades.0.titulo', 'Opening roda'));
    }

    public function test_errores_en_el_idioma_de_la_pagina(): void
    {
        $encuentro = $this->encuentro();
        $this->get(self::PAGINA.'/?lang=pt');

        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['consentimiento' => false]))
            ->assertSessionHasErrors(['consentimiento' => 'Para se inscrever, você precisa autorizar o uso dos seus dados']);
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro, ['ya_pague' => true, 'pago_monto' => 1000]))
            ->assertSessionHasErrors(['pago_comprobante' => 'Anexe o comprovante do pagamento']);
    }

    public function test_la_inscripcion_guarda_el_idioma_y_la_consulta_lo_usa(): void
    {
        $encuentro = $this->encuentro();
        $this->get(self::PAGINA.'/?lang=en');
        $this->post(self::PAGINA.'/inscripcion', $this->datos($encuentro));
        $inscripcion = Inscripcion::sole();
        $this->assertSame('en', $inscripcion->locale);

        // Otra sesión (sin elección), con el navegador en español: en inglés igual.
        $this->flushSession();
        $this->get(self::PAGINA."/inscripcion/{$inscripcion->token}", ['Accept-Language' => 'es'])
            ->assertInertia(fn (Assert $page) => $page->where('idioma.actual', 'en'));
    }

    public function test_el_organizador_guarda_traducciones(): void
    {
        $encuentro = $this->encuentro(['starts_on' => '2027-07-02', 'ends_on' => '2027-07-04']);
        $precio = $encuentro->precios()->firstOrFail();
        $this->actingAsRole('admin');

        $this->post("/encuentros/{$encuentro->id}", [
            '_method' => 'put',
            'nombre' => $encuentro->nombre,
            'starts_on' => '2027-07-02',
            'ends_on' => '2027-07-04',
            'descripcion' => 'Tres días',
            'traducciones' => ['pt' => ['nombre' => '  Batizado (PT) ', 'descripcion' => ''], 'en' => ['descripcion' => 'Three days']],
            'precios' => [['id' => $precio->id, 'nombre' => $precio->nombre, 'valor' => $precio->valor, 'traducciones' => ['en' => ['nombre' => 'Three days']]]],
            'invitados' => [['nombre' => 'Mestre Pelé', 'bio' => 'Mestre', 'traducciones' => ['pt' => ['bio' => 'Mestre (PT)']]]],
        ])->assertSessionHasNoErrors();

        $encuentro->refresh();
        // Sin espacios sobrantes ni textos vacíos.
        $this->assertSame(['pt' => ['nombre' => 'Batizado (PT)'], 'en' => ['descripcion' => 'Three days']], $encuentro->traducciones);
        $this->assertSame(['en' => ['nombre' => 'Three days']], $precio->fresh()?->traducciones);
        $this->assertSame(['pt' => ['bio' => 'Mestre (PT)']], $encuentro->invitados()->firstOrFail()->traducciones);

        // Idiomas o campos desconocidos no pasan.
        $this->post("/encuentros/{$encuentro->id}", [
            '_method' => 'put', 'nombre' => 'X', 'starts_on' => '2027-07-02',
            'traducciones' => ['fr' => ['nombre' => 'Baptême']],
        ])->assertSessionHasErrors('traducciones');
        $this->post("/encuentros/{$encuentro->id}", [
            '_method' => 'put', 'nombre' => 'X', 'starts_on' => '2027-07-02',
            'traducciones' => ['pt' => ['slug' => 'otro']],
        ])->assertSessionHasErrors('traducciones.pt');
    }
}
