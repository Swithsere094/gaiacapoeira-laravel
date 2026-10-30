<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\EncuentroFoto;
use App\Support\Imagenes;
use App\Support\Uploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Galería de fotos de un encuentro (recuerdo), permiso
 * `encuentros.gestionar`. Se suben por tandas (PHP acepta 20 archivos por
 * petición); el navegador las manda de a 10.
 */
class EncuentroFotoController extends Controller
{
    public const POR_TANDA = 10;

    public function index(Encuentro $encuentro): Response
    {
        return Inertia::render('encuentros/fotos', [
            'encuentro' => [
                'id' => $encuentro->id,
                'nombre' => $encuentro->nombre,
                'estado' => $encuentro->estado,
            ],
            'fotos' => $encuentro->fotos->map(fn (EncuentroFoto $f) => [
                'id' => $f->id,
                'miniatura' => $f->miniatura_url,
                'foto' => $f->foto_url,
            ])->values(),
            'porTanda' => self::POR_TANDA,
        ]);
    }

    public function store(Request $request, Encuentro $encuentro): RedirectResponse
    {
        $request->validate([
            'fotos' => ['required', 'array', 'max:'.self::POR_TANDA],
            'fotos.*' => ['file', 'extensions:jpg,jpeg,png,webp', 'mimes:jpg,jpeg,png,webp', 'max:20480'],
        ], [
            'fotos.required' => 'Elige al menos una foto',
            'fotos.max' => 'Sube como máximo '.self::POR_TANDA.' fotos por vez',
            'fotos.*.extensions' => 'Las fotos tienen que ser JPG, PNG o WEBP',
            'fotos.*.mimes' => 'Las fotos tienen que ser JPG, PNG o WEBP',
            'fotos.*.max' => 'Cada foto puede pesar como máximo 20 MB',
        ]);

        $orden = (int) $encuentro->fotos()->max('sort_order');
        $subidas = 0;

        /** @var list<UploadedFile> $files */
        $files = $request->file('fotos', []);
        foreach ($files as $file) {
            $urls = Imagenes::guardarFoto($file, 'encuentros');
            $encuentro->fotos()->create([
                'foto_url' => $urls['foto'],
                'miniatura_url' => $urls['miniatura'],
                'sort_order' => ++$orden,
            ]);
            $subidas++;
        }

        return back()->with('success', $subidas === 1 ? 'Foto agregada.' : "{$subidas} fotos agregadas.");
    }

    public function destroy(Encuentro $encuentro, string $foto): RedirectResponse
    {
        $registro = $encuentro->fotos()->whereKey($foto)->firstOrFail();
        self::borrarArchivos($registro);
        $registro->delete();

        return back()->with('success', 'Foto eliminada.');
    }

    public static function borrarArchivos(EncuentroFoto $foto): void
    {
        Uploads::delete($foto->foto_url);
        if ($foto->miniatura_url !== $foto->foto_url) {
            Uploads::delete($foto->miniatura_url);
        }
    }
}
