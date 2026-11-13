<?php

namespace Tests\Feature;

use App\Models\PortuguesLote;
use App\Models\PortuguesPalabra;
use App\Models\PortuguesTarjeta;
use App\Models\Song;
use App\Models\User;
use App\Support\Repaso;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Portugués: las 1000 palabras, asociaciones, repaso espaciado y lotes. */
class PortuguesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // 15:00 en Colombia.
        $this->travelTo(CarbonImmutable::parse('2026-11-13 20:00:00', 'UTC'));
    }

    private function palabra(string $palabra): PortuguesPalabra
    {
        return PortuguesPalabra::where('palabra', $palabra)->firstOrFail();
    }

    private function tarjeta(User $user, PortuguesPalabra $palabra): PortuguesTarjeta
    {
        return PortuguesTarjeta::where('user_id', $user->id)->where('palabra_id', $palabra->id)->firstOrFail();
    }

    // ── La lista ─────────────────────────────────────────────────────

    public function test_la_migracion_carga_las_1000_palabras_en_orden(): void
    {
        $this->assertSame(1000, PortuguesPalabra::count());
        $this->assertSame(range(1, 1000), PortuguesPalabra::orderBy('posicion')->pluck('posicion')->all());
        $this->assertSame(50, PortuguesPalabra::loteDe(1000));

        // Las formas se sumaron: "ser" (é, foi, era…) queda entre las primeras.
        $ser = $this->palabra('ser');
        $this->assertLessThanOrEqual(5, $ser->posicion);
        $this->assertContains('foi', $ser->formas);

        foreach (PortuguesPalabra::pluck('tipo')->unique() as $tipo) {
            $this->assertContains($tipo, PortuguesPalabra::TIPOS);
        }
    }

    public function test_el_archivo_de_datos_no_repite_palabras_ni_formas(): void
    {
        /** @var list<array{0: int, 1: string, 2: string, 3: string, 4: list<string>, 5: string|null, 6: string|null}> $data */
        $data = require database_path('data/portugues-palabras.php');

        $palabras = array_column($data, 1);
        $this->assertSame(count($palabras), count(array_unique($palabras)));

        $formas = array_merge(...array_map(fn ($r) => array_diff($r[4], ['a', 'nos']), $data));
        $this->assertSame(count($formas), count(array_unique($formas)), 'Una forma está en dos palabras');
    }

    public function test_pide_sesion(): void
    {
        $this->get('/portugues')->assertRedirect('/auth/login');
    }

    public function test_cualquier_sesion_ve_la_pagina_con_las_palabras(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/portugues')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('portugues')
                ->has('palabras', 1000)
                ->where('palabras.0.posicion', 1)
                ->where('tarjetas', [])
                ->where('hoy', '2026-11-13')
                ->where('loteTamano', 20)
                ->where('aprendidaDias', Repaso::APRENDIDA));
    }

    public function test_las_lecciones_de_ejemplo_siguen_en_otra_direccion(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/portugues/lecciones')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('portugues/lecciones'));
    }

    public function test_marca_las_palabras_que_salen_en_el_cancionero(): void
    {
        Song::factory()->create(['lyrics' => "Paranaê, paranaê, paraná\nVou-me embora, camará"]);
        Song::factory()->create(['lyrics' => 'Eu vou dizer a meu senhor']);

        $props = $this->actingAs(User::factory()->create())->get('/portugues')->viewData('page')['props'];
        $porPalabra = collect($props['palabras'])->keyBy('palabra');

        $this->assertSame(2, $porPalabra['ir']['canciones']);       // "vou" en las dos
        $this->assertSame(1, $porPalabra['embora']['canciones']);
        $this->assertSame(1, $porPalabra['senhor']['canciones']);
        $this->assertSame(0, $porPalabra['casa']['canciones']);
    }

    // ── Asociaciones ─────────────────────────────────────────────────

    public function test_guardar_una_asociacion_la_deja_lista_para_repasar_hoy(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');

        $this->actingAs($user)->put("/portugues/palabras/{$casa->id}", [
            'suena_como' => 'kasa',
            'asociacion' => '  Una casa con patas que baila ginga  ',
        ])->assertRedirect();

        $t = $this->tarjeta($user, $casa);
        $this->assertSame('kasa', $t->suena_como);
        $this->assertSame('Una casa con patas que baila ginga', $t->asociacion);
        $this->assertNull($t->frase);
        $this->assertSame('2026-11-13', $t->proximo_repaso?->toDateString());
        $this->assertSame(PortuguesTarjeta::CON_ASOCIACION, $t->estado());
    }

    public function test_una_frase_de_ejemplo_cuenta_como_asociacion(): void
    {
        $user = User::factory()->create();
        $que = $this->palabra('que');

        $this->actingAs($user)->put("/portugues/palabras/{$que->id}", ['frase' => 'Eu sei que você vem.']);

        $this->assertSame(PortuguesTarjeta::CON_ASOCIACION, $this->tarjeta($user, $que)->estado());
    }

    public function test_guardar_vacio_sin_tarjeta_no_crea_nada_y_editar_vacio_quita_la_asociacion(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');

        $this->actingAs($user)->put("/portugues/palabras/{$casa->id}", ['asociacion' => '', 'frase' => null]);
        $this->assertSame(0, PortuguesTarjeta::count());

        $this->put("/portugues/palabras/{$casa->id}", ['asociacion' => 'Algo']);
        $this->put("/portugues/palabras/{$casa->id}", ['asociacion' => '']);
        $this->assertSame(PortuguesTarjeta::SIN_TRABAJAR, $this->tarjeta($user, $casa)->estado());
    }

    public function test_valida_el_largo(): void
    {
        $casa = $this->palabra('casa');

        $this->actingAs(User::factory()->create())
            ->put("/portugues/palabras/{$casa->id}", ['asociacion' => str_repeat('a', 1001)])
            ->assertSessionHasErrors('asociacion');
    }

    public function test_cada_persona_ve_solo_sus_tarjetas(): void
    {
        $ana = User::factory()->create();
        $beto = User::factory()->create();
        $casa = $this->palabra('casa');

        $this->actingAs($ana)->put("/portugues/palabras/{$casa->id}", ['asociacion' => 'La de Ana']);

        $this->actingAs($beto)->get('/portugues')
            ->assertInertia(fn (Assert $page) => $page->where('tarjetas', []));
        $this->actingAs($ana)->get('/portugues')
            ->assertInertia(fn (Assert $page) => $page->where("tarjetas.{$casa->id}.asociacion", 'La de Ana'));
    }

    public function test_las_tarjetas_se_borran_con_la_persona(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user)->put("/portugues/palabras/{$casa->id}", ['asociacion' => 'Algo']);
        $this->post('/portugues/lotes/1');

        $user->delete();

        $this->assertSame(0, PortuguesTarjeta::count());
        $this->assertSame(0, PortuguesLote::count());
    }

    // ── Repaso espaciado ─────────────────────────────────────────────

    public function test_bien_espacia_cada_vez_mas_hasta_aprenderla(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user);

        $intervalos = [];
        for ($i = 0; $i < 5; $i++) {
            $this->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => Repaso::BIEN])->assertRedirect();
            $intervalos[] = $this->tarjeta($user, $casa)->intervalo;
        }

        $this->assertSame([1, 3, 8, 20, 50], $intervalos);
        $t = $this->tarjeta($user, $casa);
        $this->assertSame(PortuguesTarjeta::APRENDIDA, $t->estado());
        $this->assertSame('2027-01-02', $t->proximo_repaso?->toDateString());
    }

    public function test_otra_vez_la_reinicia_para_hoy_y_dificil_crece_poco(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user);

        foreach ([Repaso::BIEN, Repaso::BIEN, Repaso::BIEN] as $nota) {
            $this->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => $nota]);
        }
        $this->assertSame(8, $this->tarjeta($user, $casa)->intervalo);

        $this->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => Repaso::DIFICIL]);
        $t = $this->tarjeta($user, $casa);
        $this->assertSame(10, $t->intervalo);
        $this->assertSame(2.35, $t->facilidad);

        $this->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => Repaso::OTRA_VEZ]);
        $t = $this->tarjeta($user, $casa);
        $this->assertSame(0, $t->intervalo);
        $this->assertSame('2026-11-13', $t->proximo_repaso?->toDateString());
        $this->assertSame(2.15, $t->facilidad);
    }

    public function test_facil_salta_mas_lejos(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user)->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => Repaso::FACIL]);

        $this->assertSame(4, $this->tarjeta($user, $casa)->intervalo);
    }

    public function test_rechaza_una_nota_desconocida(): void
    {
        $casa = $this->palabra('casa');

        $this->actingAs(User::factory()->create())
            ->post("/portugues/palabras/{$casa->id}/repaso", ['nota' => 'perfecto'])
            ->assertSessionHasErrors('nota');
    }

    public function test_marcar_y_desmarcar_como_aprendida(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user);

        $this->post("/portugues/palabras/{$casa->id}/aprendida")->assertRedirect();
        $t = $this->tarjeta($user, $casa);
        $this->assertSame(PortuguesTarjeta::APRENDIDA, $t->estado());
        $this->assertSame('2026-12-04', $t->proximo_repaso?->toDateString());

        $this->delete("/portugues/palabras/{$casa->id}/aprendida")->assertRedirect();
        $this->assertSame(0, $this->tarjeta($user, $casa)->intervalo);
    }

    // ── Lotes ────────────────────────────────────────────────────────

    public function test_saltar_una_palabra_y_volver_a_proponerla(): void
    {
        $user = User::factory()->create();
        $casa = $this->palabra('casa');
        $this->actingAs($user);

        $this->post("/portugues/palabras/{$casa->id}/saltar");
        $this->get('/portugues')->assertInertia(fn (Assert $page) => $page->where("tarjetas.{$casa->id}.saltada", true));

        $this->delete("/portugues/palabras/{$casa->id}/saltar");
        $this->assertNull($this->tarjeta($user, $casa)->saltada_at);
    }

    public function test_marcar_un_lote_como_avanzado_y_deshacerlo(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->post('/portugues/lotes/1')->assertRedirect();
        $this->post('/portugues/lotes/1');
        $this->post('/portugues/lotes/3');
        $this->get('/portugues')->assertInertia(fn (Assert $page) => $page->where('lotesAvanzados', [1, 3]));

        $this->delete('/portugues/lotes/3');
        $this->get('/portugues')->assertInertia(fn (Assert $page) => $page->where('lotesAvanzados', [1]));
    }

    public function test_un_lote_que_no_existe_da_404(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/portugues/lotes/0')->assertNotFound();
        $this->post('/portugues/lotes/51')->assertNotFound();
    }
}
