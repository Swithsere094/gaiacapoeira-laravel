<?php

namespace App\Http\Controllers;

use App\Models\Politica;
use App\Support\Uploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Documentos de política interna. Ver: cualquier usuario. Crear, editar y
 * eliminar: solo admin.
 *
 * A diferencia del sitio anterior (subir el archivo en una petición y después
 * guardar la URL que mandaba el navegador), el archivo viaja en la misma
 * petición que el documento y la URL la decide siempre el servidor.
 */
class PoliticaController extends Controller
{
    public const CATEGORIES = [
        'Manual de Convivencia',
        'Cordas y Graduación',
        'Reglamento',
        'Comunicados',
        'Otro',
    ];

    public function index(): Response
    {
        return Inertia::render('politica', [
            'docs' => Politica::orderByDesc('created_at')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $file = $this->uploadedFile($request);

        Politica::create([
            ...$data,
            'file_url' => $file ? Uploads::store($file, 'politica') : null,
            'file_name' => $file?->getClientOriginalName(),
        ]);

        return back();
    }

    public function update(Request $request, Politica $politica): RedirectResponse
    {
        $data = $this->validated($request);
        $file = $this->uploadedFile($request);

        if ($file) {
            // Archivo nuevo: reemplaza (y borra) el anterior.
            Uploads::delete($politica->file_url);
            $data['file_url'] = Uploads::store($file, 'politica');
            $data['file_name'] = $file->getClientOriginalName();
        } elseif ($request->boolean('remove_file')) {
            Uploads::delete($politica->file_url);
            $data['file_url'] = null;
            $data['file_name'] = null;
        }

        $politica->update($data);

        return back();
    }

    public function destroy(Politica $politica): RedirectResponse
    {
        Uploads::delete($politica->file_url);
        $politica->delete();

        return back();
    }

    /**
     * El archivo adjunto, si vino uno solo. `file()` también puede devolver
     * una lista (si alguien manda `file[]`); la validación ya lo rechaza,
     * pero acá solo se acepta un archivo único.
     */
    private function uploadedFile(Request $request): ?UploadedFile
    {
        $file = $request->file('file');

        return $file instanceof UploadedFile ? $file : null;
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:10000'],
            'category' => ['nullable', Rule::in(self::CATEGORIES)],
            'file' => ['nullable', 'file', 'max:20480', 'extensions:'.implode(',', Uploads::DOCUMENT_EXTENSIONS), 'mimes:'.implode(',', Uploads::DOCUMENT_EXTENSIONS)],
        ], [
            'title.required' => 'El título es obligatorio',
            'file.max' => 'El archivo no puede superar 20 MB',
            'file.extensions' => 'Tipo de archivo no permitido (PDF, DOC, DOCX, TXT, JPG, PNG o WEBP)',
            'file.mimes' => 'Tipo de archivo no permitido (PDF, DOC, DOCX, TXT, JPG, PNG o WEBP)',
        ]);

        unset($data['file']);
        $data['content'] = ($data['content'] ?? null) ?: null;
        $data['category'] = ($data['category'] ?? null) ?: null;

        return $data;
    }
}
