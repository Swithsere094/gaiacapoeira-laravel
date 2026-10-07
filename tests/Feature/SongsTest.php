<?php

namespace Tests\Feature;

use App\Models\Song;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SongsTest extends TestCase
{
    use RefreshDatabase;

    private array $valid = [
        'title' => 'Paranauê',
        'type' => 'corrido',
        'lyrics' => 'Paranauê, paraná...',
        'tags' => ['Angola', 'São Bento Grande'],
    ];

    public function test_requiere_sesion(): void
    {
        $this->get('/canciones')->assertRedirect('/auth/login');
        $this->post('/canciones', $this->valid)->assertRedirect('/auth/login');
    }

    public function test_lista_las_canciones_mas_nuevas_primero(): void
    {
        $this->actingAsRole('member');
        Song::factory()->create(['title' => 'Vieja', 'created_at' => now()->subDay()]);
        Song::factory()->create(['title' => 'Nueva']);

        $this->get('/canciones')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('canciones')
            ->has('songs', 2)
            ->where('songs.0.title', 'Nueva')
        );
    }

    public function test_un_miembro_crea_una_cancion_con_ritmos_como_lista(): void
    {
        $this->actingAsRole('member');

        $this->post('/canciones', $this->valid)->assertSessionHasNoErrors();

        $song = Song::first();
        $this->assertSame(['Angola', 'São Bento Grande'], $song->tags);
        $this->assertFalse($song->nossa);
    }

    public function test_exige_titulo_tipo_y_letra_y_un_tipo_valido(): void
    {
        $this->actingAsRole('member');

        $this->post('/canciones', ['title' => 'Solo título'])->assertSessionHasErrors(['type', 'lyrics']);
        $this->post('/canciones', [...$this->valid, 'type' => 'reggaeton'])->assertSessionHasErrors('type');
        $this->assertDatabaseCount('songs', 0);
    }

    public function test_el_video_tiene_que_ser_de_youtube_o_vimeo(): void
    {
        $this->actingAsRole('member');

        foreach ([
            'https://sitio-falso.com/login',
            'https://evil.com/?youtube.com/embed/abcdefghijk',
            'https://youtube.com.evil.com/watch?v=abcdefghijk',
            'javascript:alert(1)',
        ] as $url) {
            $this->post('/canciones', [...$this->valid, 'video_url' => $url])
                ->assertSessionHasErrors(['video_url' => 'El video tiene que ser un enlace de YouTube o Vimeo.']);
        }

        foreach (['https://www.youtube.com/watch?v=abcdefghijk', 'https://youtu.be/abcdefghijk', 'https://vimeo.com/123456'] as $url) {
            $this->post('/canciones', [...$this->valid, 'video_url' => $url])->assertSessionHasNoErrors();
        }

        $this->assertDatabaseCount('songs', 3);
    }

    public function test_sin_ritmos_guarda_tags_null(): void
    {
        $this->actingAsRole('member');

        $this->post('/canciones', [...$this->valid, 'tags' => []]);

        $this->assertNull(Song::first()->tags);
    }

    public function test_cualquier_miembro_puede_editar(): void
    {
        $this->actingAsRole('member');
        $song = Song::factory()->create();

        $this->put("/canciones/{$song->id}", [...$this->valid, 'title' => 'Título editado'])
            ->assertSessionHasNoErrors();

        $this->assertSame('Título editado', $song->fresh()->title);
    }

    // ── Marca "nossa" ───────────────────────────────────────────────

    public function test_un_miembro_puede_marcarla_nossa_al_crear(): void
    {
        $this->actingAsRole('member');

        $this->post('/canciones', [...$this->valid, 'nossa' => true]);

        $this->assertTrue(Song::first()->nossa);
    }

    public function test_un_miembro_no_puede_cambiar_nossa_al_editar(): void
    {
        $this->actingAsRole('member');
        $song = Song::factory()->create(['nossa' => true]);

        $this->put("/canciones/{$song->id}", [...$this->valid, 'title' => 'Editada', 'nossa' => false])
            ->assertSessionHasNoErrors();

        $this->assertSame('Editada', $song->fresh()->title);
        $this->assertTrue($song->fresh()->nossa);
    }

    public function test_un_admin_si_puede_cambiar_nossa_al_editar(): void
    {
        $this->actingAsRole('admin');
        $song = Song::factory()->create(['nossa' => false]);

        $this->put("/canciones/{$song->id}", [...$this->valid, 'nossa' => true]);

        $this->assertTrue($song->fresh()->nossa);
    }

    // ── Borrar ──────────────────────────────────────────────────────

    public function test_un_miembro_no_puede_borrar(): void
    {
        $this->actingAsRole('member');
        $song = Song::factory()->create();

        $this->delete("/canciones/{$song->id}")->assertForbidden();
        $this->assertDatabaseHas('songs', ['id' => $song->id]);
    }

    public function test_un_admin_borra(): void
    {
        $this->actingAsRole('admin');
        $song = Song::factory()->create();

        $this->delete("/canciones/{$song->id}")->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('songs', ['id' => $song->id]);
    }
}
