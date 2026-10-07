<?php

namespace App\Services;

use App\Support\VideoUrl;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Lee una playlist de YouTube (API v3) e importa a una tabla los videos que
 * todavía no estén. Usado por la sincronización manual de rodas y cantorias
 * (botones "Sync YouTube" en /galera, solo admin). Mismo comportamiento que
 * las rutas /api/rodas/sync y /api/cantorias/sync del sitio anterior.
 */
class YouTubePlaylist
{
    /**
     * @return list<array{video_id: string, title: string, description: ?string, thumbnail_url: ?string, published_on: string}>
     */
    public function videos(string $playlistId, string $apiKey): array
    {
        $videos = [];
        $pageToken = null;

        do {
            $response = Http::timeout(20)->get('https://www.googleapis.com/youtube/v3/playlistItems', array_filter([
                'part' => 'snippet',
                'playlistId' => $playlistId,
                'maxResults' => 50,
                'key' => $apiKey,
                'pageToken' => $pageToken,
            ]));

            if ($response->failed()) {
                $message = $response->json('error.message') ?? $response->reason();
                throw new RuntimeException("YouTube API: {$message}");
            }

            foreach ($response->json('items') ?? [] as $item) {
                $snippet = $item['snippet'] ?? [];
                $videoId = $snippet['resourceId']['videoId'] ?? null;
                $thumbnails = $snippet['thumbnails'] ?? [];

                // Videos privados o eliminados vienen sin miniaturas: se saltan.
                if (! $videoId || empty($thumbnails)) {
                    continue;
                }

                $description = $snippet['description'] ?? '';

                $videos[] = [
                    'video_id' => $videoId,
                    'title' => $snippet['title'] ?? 'Sin título',
                    'description' => $description !== '' ? mb_substr($description, 0, 500) : null,
                    'thumbnail_url' => $thumbnails['high']['url'] ?? $thumbnails['medium']['url'] ?? null,
                    'published_on' => substr($snippet['publishedAt'] ?? now()->toIso8601String(), 0, 10),
                ];
            }

            $pageToken = $response->json('nextPageToken');
        } while ($pageToken);

        return $videos;
    }

    /**
     * IDs de YouTube ya guardados, a partir de las URLs existentes.
     *
     * @param  iterable<?string>  $urls
     * @return array<string, true>
     */
    public static function knownIds(iterable $urls): array
    {
        $known = [];

        foreach ($urls as $url) {
            if ($id = VideoUrl::youTubeId($url)) {
                $known[$id] = true;
            }
        }

        return $known;
    }
}
