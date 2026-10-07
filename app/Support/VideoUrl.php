<?php

namespace App\Support;

/**
 * Utilidades para URLs de YouTube. Mismo comportamiento que
 * resources/js/lib/utils/video-url.ts (getYouTubeId).
 */
final class VideoUrl
{
    /** ID de 11 caracteres de un video de YouTube, o null si no es YouTube. */
    public static function youTubeId(?string $url): ?string
    {
        if (! $url) {
            return null;
        }

        $patterns = [
            '~youtu\.be/([a-zA-Z0-9_-]{11})~',
            '~youtube\.com/shorts/([a-zA-Z0-9_-]{11})~',
            '~youtube\.com/(?:watch\?(?:.*&)?v=|embed/)([a-zA-Z0-9_-]{11})~',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $m)) {
                return $m[1];
            }
        }

        return null;
    }
}
