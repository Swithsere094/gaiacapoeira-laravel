<?php

namespace App\Http\Controllers;

use App\Models\Cantoria;
use App\Models\Roda;
use App\Services\YouTubePlaylist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * Galera: rodas (videos de eventos) y cantorias (videos de canto).
 * Ver y buscar: cualquier usuario. Agregar, eliminar y sincronizar con
 * YouTube: solo admin (rutas bajo el middleware `admin`).
 */
class GaleraController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('galera', [
            // Más recientes primero; sin fecha al final (como el sitio anterior).
            'rodas' => Roda::orderByDesc('event_date')->get(),
            'cantorias' => Cantoria::orderByDesc('event_date')->get(),
        ]);
    }

    public function storeRoda(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'video_url' => ['required', 'url:http,https', 'max:2000'],
            'description' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'event_date' => ['nullable', 'date_format:Y-m-d'],
        ], [
            'title.required' => 'Título y URL de video son obligatorios',
            'video_url.required' => 'Título y URL de video son obligatorios',
            'video_url.url' => 'La URL del video no es válida',
        ]);

        Roda::create([...$this->nullIfEmpty($data, ['description', 'location', 'event_date']), 'views' => 0]);

        return back();
    }

    public function destroyRoda(Roda $roda): RedirectResponse
    {
        $roda->delete();

        return back();
    }

    public function storeCantoria(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'video_url' => ['nullable', 'url:http,https', 'max:2000'],
            'description' => ['nullable', 'string', 'max:5000'],
            'event_date' => ['nullable', 'date_format:Y-m-d'],
        ], [
            'title.required' => 'El título es obligatorio',
            'video_url.url' => 'La URL del video no es válida',
        ]);

        Cantoria::create($this->nullIfEmpty($data, ['video_url', 'description', 'event_date']));

        return back();
    }

    public function destroyCantoria(Cantoria $cantoria): RedirectResponse
    {
        $cantoria->delete();

        return back();
    }

    public function syncRodas(YouTubePlaylist $youtube): RedirectResponse
    {
        return $this->sync($youtube, config('services.youtube.rodas_playlist'), 'YOUTUBE_PLAYLIST_ID', function (array $video) {
            Roda::create([
                'title' => $video['title'],
                'description' => $video['description'],
                'video_url' => "https://www.youtube.com/watch?v={$video['video_id']}",
                'thumbnail_url' => $video['thumbnail_url'],
                'event_date' => $video['published_on'],
                'views' => 0,
            ]);
        }, Roda::pluck('video_url'), 'roda');
    }

    public function syncCantorias(YouTubePlaylist $youtube): RedirectResponse
    {
        return $this->sync($youtube, config('services.youtube.cantorias_playlist'), 'YOUTUBE_CANTORIAS_PLAYLIST_ID', function (array $video) {
            Cantoria::create([
                'title' => $video['title'],
                'description' => $video['description'],
                'video_url' => "https://www.youtube.com/watch?v={$video['video_id']}",
                'event_date' => $video['published_on'],
            ]);
        }, Cantoria::pluck('video_url'), 'cantoria');
    }

    /**
     * @param  iterable<?string>  $existingUrls
     */
    private function sync(YouTubePlaylist $youtube, ?string $playlistId, string $playlistEnv, callable $insert, iterable $existingUrls, string $noun): RedirectResponse
    {
        $apiKey = config('services.youtube.key');

        if (! $apiKey || ! $playlistId) {
            return back()->with('error', "Faltan variables de entorno: YOUTUBE_API_KEY y/o {$playlistEnv}");
        }

        try {
            $known = YouTubePlaylist::knownIds($existingUrls);
            $inserted = 0;

            foreach ($youtube->videos($playlistId, $apiKey) as $video) {
                if (isset($known[$video['video_id']])) {
                    continue;
                }

                $insert($video);
                $known[$video['video_id']] = true;
                $inserted++;
            }
        } catch (Throwable $e) {
            report($e);

            return back()->with('error', 'Error al sincronizar con YouTube');
        }

        $message = $inserted > 0
            ? $inserted.' '.$noun.($inserted !== 1 ? 's' : '').' importada'.($inserted !== 1 ? 's' : '')
            : 'Todo al día ✓';

        return back()->with('success', $message);
    }

    /**
     * Strings vacíos → null (como el `|| null` del sitio anterior).
     *
     * @param  array<string, mixed>  $data
     * @param  list<string>  $keys
     * @return array<string, mixed>
     */
    private function nullIfEmpty(array $data, array $keys): array
    {
        foreach ($keys as $key) {
            $data[$key] = ($data[$key] ?? null) ?: null;
        }

        return $data;
    }
}
