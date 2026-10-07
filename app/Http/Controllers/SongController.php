<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Cancionero "Sabiá cantou".
 *
 * Permisos (iguales al sitio anterior): ver, crear y editar → cualquier
 * usuario con sesión; eliminar → solo admin. La marca `nossa` (canción
 * propia del grupo): al crear la marca cualquiera; al editar, solo un admin
 * puede cambiarla (si la manda un miembro, se ignora y queda como estaba).
 */
class SongController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('canciones', [
            'songs' => Song::orderByDesc('created_at')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        Song::create([...$data, 'nossa' => $request->boolean('nossa')]);

        return back();
    }

    public function update(Request $request, Song $song): RedirectResponse
    {
        $data = $this->validated($request);

        if ($request->user()->isAdmin() && $request->has('nossa')) {
            $data['nossa'] = $request->boolean('nossa');
        }

        $song->update($data);

        return back();
    }

    public function destroy(Song $song): RedirectResponse
    {
        $song->delete();

        return back();
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(Song::TYPES)],
            'lyrics' => ['required', 'string', 'max:20000'],
            'translation' => ['nullable', 'string', 'max:20000'],
            'context' => ['nullable', 'string', 'max:20000'],
            'video_url' => ['nullable', 'url:http,https', 'max:2000'],
            'mestre' => ['nullable', 'string', 'max:255'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['string', 'max:100'],
        ], [
            'title.required' => 'Título, tipo y letra son obligatorios',
            'type.required' => 'Título, tipo y letra son obligatorios',
            'lyrics.required' => 'Título, tipo y letra son obligatorios',
            'type.in' => 'Tipo de canción inválido',
            'video_url.url' => 'La URL del video no es válida',
        ]);

        foreach (['translation', 'context', 'video_url', 'mestre'] as $key) {
            $data[$key] = ($data[$key] ?? null) ?: null;
        }

        $data['tags'] = ! empty($data['tags']) ? array_values($data['tags']) : null;

        return $data;
    }
}
