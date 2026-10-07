<?php

namespace Tests\Feature;

use App\Models\Cantoria;
use App\Models\Roda;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GaleraTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.youtube.key' => 'test-key',
            'services.youtube.rodas_playlist' => 'PL-rodas',
            'services.youtube.cantorias_playlist' => 'PL-cantorias',
        ]);
    }

    /** Respuesta falsa de la API de YouTube con los videos dados. */
    private function playlistItem(string $videoId, string $title, bool $private = false): array
    {
        return ['snippet' => [
            'title' => $title,
            'description' => "Descripción de {$title}",
            'publishedAt' => '2026-08-15T10:00:00Z',
            'thumbnails' => $private ? [] : ['high' => ['url' => "https://i.ytimg.com/vi/{$videoId}/hq.jpg"]],
            'resourceId' => ['kind' => 'youtube#video', 'videoId' => $videoId],
        ]];
    }

    // ── Ver ─────────────────────────────────────────────────────────

    public function test_cualquier_miembro_ve_rodas_y_cantorias(): void
    {
        $this->actingAsRole('member');
        Roda::factory()->create(['event_date' => '2026-01-10', 'title' => 'Enero']);
        Roda::factory()->create(['event_date' => '2026-03-10', 'title' => 'Marzo']);
        Cantoria::factory()->create();

        $this->get('/galera')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('galera')
            ->has('rodas', 2)
            ->where('rodas.0.title', 'Marzo')
            ->where('rodas.0.event_date', '2026-03-10')
            ->has('cantorias', 1)
        );
    }

    public function test_rodas_redirige_a_galera(): void
    {
        $this->actingAsRole('member');

        $this->get('/rodas')->assertRedirect('/galera');
    }

    // ── Permisos ────────────────────────────────────────────────────

    public function test_un_miembro_no_puede_agregar_borrar_ni_sincronizar(): void
    {
        $this->actingAsRole('member');
        $roda = Roda::factory()->create();
        $cantoria = Cantoria::factory()->create();
        Http::fake();

        $this->post('/galera/rodas', ['title' => 'X', 'video_url' => 'https://youtu.be/abcdefghijk'])->assertForbidden();
        $this->delete("/galera/rodas/{$roda->id}")->assertForbidden();
        $this->post('/galera/rodas/sync')->assertForbidden();
        $this->post('/galera/cantorias', ['title' => 'X'])->assertForbidden();
        $this->delete("/galera/cantorias/{$cantoria->id}")->assertForbidden();
        $this->post('/galera/cantorias/sync')->assertForbidden();

        Http::assertNothingSent();
        $this->assertDatabaseCount('rodas', 1);
        $this->assertDatabaseCount('cantorias', 1);
    }

    // ── Rodas ───────────────────────────────────────────────────────

    public function test_un_admin_agrega_una_roda(): void
    {
        $this->actingAsRole('admin');

        $this->post('/galera/rodas', [
            'title' => 'Roda verano — João', 'video_url' => 'https://www.youtube.com/watch?v=abcdefghijk',
            'description' => '', 'location' => 'Parque', 'event_date' => '2026-07-02',
        ])->assertSessionHasNoErrors();

        $roda = Roda::first();
        $this->assertNull($roda->description);
        $this->assertSame('2026-07-02', $roda->event_date->format('Y-m-d'));
        $this->assertSame(0, $roda->views);
    }

    public function test_una_roda_exige_titulo_y_una_url_valida(): void
    {
        $this->actingAsRole('admin');

        $this->post('/galera/rodas', ['title' => 'X'])->assertSessionHasErrors('video_url');
        $this->post('/galera/rodas', ['title' => 'X', 'video_url' => 'javascript:alert(1)'])->assertSessionHasErrors('video_url');
        $this->assertDatabaseCount('rodas', 0);
    }

    public function test_un_admin_borra_una_roda(): void
    {
        $this->actingAsRole('admin');
        $roda = Roda::factory()->create();

        $this->delete("/galera/rodas/{$roda->id}");

        $this->assertDatabaseMissing('rodas', ['id' => $roda->id]);
    }

    // ── Cantorias ───────────────────────────────────────────────────

    public function test_un_admin_agrega_y_borra_una_cantoria_sin_video(): void
    {
        $this->actingAsRole('admin');

        $this->post('/galera/cantorias', ['title' => 'Cantoria de enero', 'video_url' => ''])->assertSessionHasNoErrors();
        $cantoria = Cantoria::first();
        $this->assertNull($cantoria->video_url);

        $this->delete("/galera/cantorias/{$cantoria->id}");
        $this->assertDatabaseCount('cantorias', 0);
    }

    // ── Sincronización con YouTube ──────────────────────────────────

    public function test_sync_importa_solo_videos_nuevos_y_visibles_recorriendo_todas_las_paginas(): void
    {
        $this->actingAsRole('admin');
        Roda::factory()->create(['video_url' => 'https://youtu.be/YAEXISTE001']);

        Http::fake([
            'www.googleapis.com/*' => Http::sequence()
                ->push(['nextPageToken' => 'p2', 'items' => [
                    $this->playlistItem('YAEXISTE001', 'Repetido'),
                    $this->playlistItem('NUEVO000001', 'Roda nueva 1'),
                ]])
                ->push(['items' => [
                    $this->playlistItem('PRIVADO0001', 'Privado', private: true),
                    $this->playlistItem('NUEVO000002', 'Roda nueva 2'),
                ]]),
        ]);

        $this->post('/galera/rodas/sync')->assertSessionHas('success', '2 rodas importadas');

        $this->assertDatabaseCount('rodas', 3);
        $nueva = Roda::where('title', 'Roda nueva 1')->first();
        $this->assertSame('https://www.youtube.com/watch?v=NUEVO000001', $nueva->video_url);
        $this->assertSame('https://i.ytimg.com/vi/NUEVO000001/hq.jpg', $nueva->thumbnail_url);
        $this->assertSame('2026-08-15', $nueva->event_date->format('Y-m-d'));
        Http::assertSentCount(2);
        Http::assertSent(fn ($request) => $request['playlistId'] === 'PL-rodas' && $request['key'] === 'test-key');
    }

    public function test_sync_sin_novedades_dice_todo_al_dia(): void
    {
        $this->actingAsRole('admin');
        Cantoria::factory()->create(['video_url' => 'https://www.youtube.com/watch?v=YAEXISTE001']);
        Http::fake(['www.googleapis.com/*' => Http::response(['items' => [$this->playlistItem('YAEXISTE001', 'Repetido')]])]);

        $this->post('/galera/cantorias/sync')->assertSessionHas('success', 'Todo al día ✓');

        $this->assertDatabaseCount('cantorias', 1);
        Http::assertSent(fn ($request) => $request['playlistId'] === 'PL-cantorias');
    }

    public function test_sync_sin_configuracion_avisa_y_no_llama_a_youtube(): void
    {
        $this->actingAsRole('admin');
        config(['services.youtube.key' => null]);
        Http::fake();

        $this->post('/galera/rodas/sync')->assertSessionHas('error');

        Http::assertNothingSent();
    }

    public function test_sync_con_error_de_youtube_no_rompe_y_avisa(): void
    {
        $this->actingAsRole('admin');
        Http::fake(['www.googleapis.com/*' => Http::response(['error' => ['message' => 'API key not valid']], 400)]);

        $this->post('/galera/rodas/sync')->assertSessionHas('error', 'Error al sincronizar con YouTube');

        $this->assertDatabaseCount('rodas', 0);
    }
}
