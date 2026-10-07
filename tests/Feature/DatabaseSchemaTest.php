<?php

namespace Tests\Feature;

use App\Models\PageView;
use App\Models\Roda;
use App\Models\Song;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Fase 1: la migración base reproduce el esquema heredado y los modelos
 * leen/escriben esos datos igual que el sitio anterior.
 */
class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_migracion_base_crea_las_13_tablas_heredadas(): void
    {
        foreach ([
            'usuarios', 'cantorias', 'politica', 'rodas', 'songs', 'page_views',
            'articles', 'movements', 'portuguese_lessons', 'portuguese_vocabulary',
            'comments', 'favorites', 'user_lesson_progress',
        ] as $table) {
            $this->assertTrue(Schema::hasTable($table), "Falta la tabla {$table}");
        }
    }

    public function test_la_migracion_base_no_toca_tablas_que_ya_existen(): void
    {
        $user = User::factory()->create();

        // Re-ejecutar la migración base sobre una base con datos no debe
        // recrear ni vaciar nada (es lo que pasa en producción).
        $migration = require database_path('migrations/0001_01_01_000000_create_gaia_base_schema.php');
        $migration->up();

        $this->assertDatabaseHas('usuarios', ['id' => $user->id]);
    }

    public function test_los_ids_son_uuid_generados_por_la_aplicacion(): void
    {
        $user = User::factory()->create();

        $this->assertMatchesRegularExpression('/^[0-9a-f-]{36}$/', $user->id);
    }

    public function test_un_hash_heredado_de_bcryptjs_2b_sigue_sirviendo_para_iniciar_sesion(): void
    {
        // bcryptjs guarda los hashes con prefijo $2b$; PHP genera $2y$. Es el
        // mismo algoritmo: se arma un hash válido con el prefijo heredado.
        $hash = password_hash('secreto123', PASSWORD_BCRYPT, ['cost' => 4]);
        $legacyHash = '$2b$'.substr($hash, 4);

        $user = User::factory()->create(['username' => 'heredado']);
        DB::table('usuarios')->where('id', $user->id)->update(['password_hash' => $legacyHash]);

        $this->assertTrue(Auth::validate(['username' => 'heredado', 'password' => 'secreto123']));
        $this->assertFalse(Auth::validate(['username' => 'heredado', 'password' => 'otra']));
    }

    public function test_el_hash_de_la_contrasena_nunca_se_serializa(): void
    {
        $user = User::factory()->create();

        $this->assertArrayNotHasKey('password_hash', $user->toArray());
    }

    public function test_las_columnas_json_se_leen_como_listas(): void
    {
        $song = Song::create([
            'title' => 'Paranauê', 'type' => 'corrido', 'lyrics' => 'Paranauê, paraná',
            'tags' => ['Angola', 'São Bento Grande'],
        ]);

        $fresh = Song::find($song->id);
        $this->assertSame(['Angola', 'São Bento Grande'], $fresh->tags);
        $this->assertFalse($fresh->nossa);
    }

    public function test_las_fechas_de_evento_se_serializan_sin_hora(): void
    {
        $roda = Roda::create(['title' => 'Roda', 'video_url' => 'https://youtu.be/abcdefghijk', 'event_date' => '2026-07-02']);

        $this->assertSame('2026-07-02', Roda::find($roda->id)->toArray()['event_date']);
    }

    public function test_page_views_solo_tiene_created_at_y_lo_pone_la_aplicacion(): void
    {
        $view = PageView::create(['path' => '/canciones']);

        $this->assertNotNull($view->created_at);
        $this->assertTrue(abs(now()->diffInSeconds($view->created_at)) < 5);
    }

    public function test_borrar_un_usuario_conserva_su_contenido_curado(): void
    {
        $user = User::factory()->create();
        $song = Song::create(['title' => 'X', 'type' => 'corrido', 'lyrics' => 'x', 'user_id' => $user->id]);

        $user->delete();

        $this->assertNull(Song::find($song->id)->user_id);
    }
}
