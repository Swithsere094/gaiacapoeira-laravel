<?php

namespace Tests\Feature;

use App\Models\Politica;
use App\Support\Uploads;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PoliticaTest extends TestCase
{
    use RefreshDatabase;

    private string $publicDir;

    protected function setUp(): void
    {
        parent::setUp();

        // Los archivos de los tests van a una carpeta temporal, nunca a la
        // public/uploads real.
        $this->publicDir = sys_get_temp_dir().DIRECTORY_SEPARATOR.'gaia-test-public-'.uniqid();
        File::ensureDirectoryExists($this->publicDir.'/uploads');
        $this->app->usePublicPath($this->publicDir);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->publicDir);
        parent::tearDown();
    }

    private function pdf(string $name = 'Reglamento 2026.pdf'): UploadedFile
    {
        return $this->realUpload($name, "%PDF-1.4\n1 0 obj << >> endobj\n%%EOF\n");
    }

    /**
     * Archivo real en disco: su tipo se detecta por el CONTENIDO (como en una
     * subida de verdad). Los UploadedFile::fake() de Laravel declaran el tipo
     * según la extensión y no sirven para probar archivos disfrazados.
     */
    private function realUpload(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'gaia-upload-');
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function diskPath(string $url): string
    {
        return $this->publicDir.str_replace('/', DIRECTORY_SEPARATOR, $url);
    }

    // ── Ver ─────────────────────────────────────────────────────────

    public function test_cualquier_miembro_ve_los_documentos_cordas_y_manual(): void
    {
        $this->actingAsRole('member');
        Politica::factory()->count(2)->create();

        $this->get('/politica')->assertOk()->assertInertia(fn (Assert $page) => $page->component('politica')->has('docs', 2));
        $this->get('/politica/cordas')->assertOk()->assertInertia(fn (Assert $page) => $page->component('politica/cordas'));
        $this->get('/politica/manual')->assertOk()->assertInertia(fn (Assert $page) => $page->component('politica/manual'));
    }

    public function test_un_miembro_no_puede_crear_editar_ni_borrar(): void
    {
        $this->actingAsRole('member');
        $doc = Politica::factory()->create();

        $this->post('/politica', ['title' => 'X'])->assertForbidden();
        $this->put("/politica/{$doc->id}", ['title' => 'X'])->assertForbidden();
        $this->delete("/politica/{$doc->id}")->assertForbidden();
        $this->assertDatabaseCount('politica', 1);
    }

    // ── Crear con archivo ───────────────────────────────────────────

    public function test_un_admin_crea_un_documento_con_pdf_y_nombre_seguro(): void
    {
        $this->actingAsRole('admin');

        $this->post('/politica', [
            'title' => 'Reglamento', 'category' => 'Reglamento', 'content' => '', 'file' => $this->pdf('Regla mento ñ (v2).pdf'),
        ])->assertSessionHasNoErrors();

        $doc = Politica::first();
        $this->assertMatchesRegularExpression('#^/uploads/politica/\d{13}_Regla_mento____v2_\.pdf$#', $doc->file_url);
        $this->assertSame('Regla mento ñ (v2).pdf', $doc->file_name);
        $this->assertNull($doc->content);
        $this->assertFileExists($this->diskPath($doc->file_url));
    }

    public function test_crea_un_documento_sin_archivo(): void
    {
        $this->actingAsRole('admin');

        $this->post('/politica', ['title' => 'Comunicado', 'category' => 'Comunicados'])->assertSessionHasNoErrors();

        $this->assertNull(Politica::first()->file_url);
    }

    public function test_rechaza_scripts_y_archivos_disfrazados(): void
    {
        $this->actingAsRole('admin');

        $this->post('/politica', ['title' => 'X', 'file' => $this->realUpload('shell.php', '<?php system($_GET["c"]);')])
            ->assertSessionHasErrors('file');
        $this->post('/politica', ['title' => 'X', 'file' => $this->realUpload('shell.phtml', '<?php echo 1;')])
            ->assertSessionHasErrors('file');
        // Extensión permitida pero el contenido es PHP.
        $this->post('/politica', ['title' => 'X', 'file' => $this->realUpload('falso.pdf', '<?php echo 1;')])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('politica', 0);
        $this->assertSame([], File::allFiles($this->publicDir.'/uploads'));
    }

    public function test_rechaza_archivos_de_mas_de_20_mb(): void
    {
        $this->actingAsRole('admin');

        $this->post('/politica', ['title' => 'X', 'file' => UploadedFile::fake()->create('grande.pdf', 20481, 'application/pdf')])
            ->assertSessionHasErrors(['file' => 'El archivo no puede superar 20 MB']);
    }

    public function test_rechaza_categorias_inventadas(): void
    {
        $this->actingAsRole('admin');

        $this->post('/politica', ['title' => 'X', 'category' => 'Hackeo'])->assertSessionHasErrors('category');
    }

    // ── Editar ──────────────────────────────────────────────────────

    public function test_reemplazar_el_archivo_borra_el_anterior(): void
    {
        $this->actingAsRole('admin');
        $this->post('/politica', ['title' => 'Doc', 'file' => $this->pdf('viejo.pdf')]);
        $doc = Politica::first();
        $oldPath = $this->diskPath($doc->file_url);

        $this->put("/politica/{$doc->id}", ['title' => 'Doc', 'file' => $this->pdf('nuevo.pdf')])->assertSessionHasNoErrors();

        $doc->refresh();
        $this->assertSame('nuevo.pdf', $doc->file_name);
        $this->assertFileExists($this->diskPath($doc->file_url));
        $this->assertFileDoesNotExist($oldPath);
    }

    public function test_editar_sin_archivo_conserva_el_actual(): void
    {
        $this->actingAsRole('admin');
        $this->post('/politica', ['title' => 'Doc', 'file' => $this->pdf()]);
        $doc = Politica::first();
        $url = $doc->file_url;

        $this->put("/politica/{$doc->id}", ['title' => 'Doc renombrado'])->assertSessionHasNoErrors();

        $this->assertSame($url, $doc->fresh()->file_url);
        $this->assertSame('Doc renombrado', $doc->fresh()->title);
    }

    public function test_quitar_el_archivo_lo_borra(): void
    {
        $this->actingAsRole('admin');
        $this->post('/politica', ['title' => 'Doc', 'file' => $this->pdf()]);
        $doc = Politica::first();
        $path = $this->diskPath($doc->file_url);

        $this->put("/politica/{$doc->id}", ['title' => 'Doc', 'remove_file' => '1']);

        $this->assertNull($doc->fresh()->file_url);
        $this->assertFileDoesNotExist($path);
    }

    // ── Borrar ──────────────────────────────────────────────────────

    public function test_borrar_un_documento_borra_su_archivo(): void
    {
        $this->actingAsRole('admin');
        $this->post('/politica', ['title' => 'Doc', 'file' => $this->pdf()]);
        $doc = Politica::first();
        $path = $this->diskPath($doc->file_url);

        $this->delete("/politica/{$doc->id}");

        $this->assertDatabaseCount('politica', 0);
        $this->assertFileDoesNotExist($path);
    }

    public function test_un_file_url_manipulado_nunca_borra_fuera_de_uploads(): void
    {
        $this->actingAsRole('admin');
        $sentinel = $this->publicDir.DIRECTORY_SEPARATOR.'importante.txt';
        File::put($sentinel, 'no me borres');
        $doc = Politica::factory()->create(['file_url' => '/uploads/../importante.txt']);

        $this->delete("/politica/{$doc->id}");

        $this->assertFileExists($sentinel);
        $this->assertNull(Uploads::pathFor('/uploads/../importante.txt'));
        $this->assertNull(Uploads::pathFor('https://otro-sitio.com/x.pdf'));
    }
}
