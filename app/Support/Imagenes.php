<?php

namespace App\Support;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

/**
 * Fotos de la galería de un encuentro: se guardan reducidas (las del celular
 * pesan varios MB) y con miniatura, enderezadas según la orientación EXIF
 * de la cámara. Si el servidor no tiene GD o la imagen no se puede leer, se
 * guarda el original tal cual (foto y miniatura = el mismo archivo).
 */
final class Imagenes
{
    public const LADO_FOTO = 2000;

    public const LADO_MINIATURA = 480;

    private const CALIDAD = 82;

    /** @return array{foto: string, miniatura: string} URLs `/uploads/…` */
    public static function guardarFoto(UploadedFile $file, string $folder): array
    {
        $imagen = self::abrir((string) $file->getRealPath());

        if ($imagen === null) {
            $url = Uploads::store($file, $folder);

            return ['foto' => $url, 'miniatura' => $url];
        }

        $base = (int) floor(microtime(true) * 1000).'_'.Str::lower(Str::random(8));
        $foto = self::escribir($imagen, self::LADO_FOTO, $folder, "{$base}.jpg");
        $miniatura = self::escribir($imagen, self::LADO_MINIATURA, $folder, "{$base}_mini.jpg");
        imagedestroy($imagen);

        return ['foto' => $foto, 'miniatura' => $miniatura];
    }

    private static function abrir(string $path): ?GdImage
    {
        if (! function_exists('imagecreatefromstring') || ! is_file($path)) {
            return null;
        }

        $contenido = file_get_contents($path);
        $imagen = $contenido === false ? false : @imagecreatefromstring($contenido);
        if (! $imagen instanceof GdImage) {
            return null;
        }

        // Las fotos del celular vienen "acostadas" con la orientación en EXIF.
        $exif = function_exists('exif_read_data') ? @exif_read_data($path) : false;
        $rotacion = match (is_array($exif) ? ($exif['Orientation'] ?? 1) : 1) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };
        if ($rotacion !== 0) {
            $girada = imagerotate($imagen, $rotacion, 0);
            if ($girada instanceof GdImage) {
                imagedestroy($imagen);
                $imagen = $girada;
            }
        }

        return $imagen;
    }

    private static function escribir(GdImage $imagen, int $lado, string $folder, string $name): string
    {
        $ancho = imagesx($imagen);
        $alto = imagesy($imagen);
        $escala = min(1, $lado / max($ancho, $alto));
        $nuevoAncho = max(1, (int) round($ancho * $escala));
        $nuevoAlto = max(1, (int) round($alto * $escala));

        $destino = imagecreatetruecolor($nuevoAncho, $nuevoAlto);
        // Fondo blanco: un PNG transparente no queda negro en JPG.
        imagefill($destino, 0, 0, (int) imagecolorallocate($destino, 255, 255, 255));
        imagecopyresampled($destino, $imagen, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $ancho, $alto);

        $dir = Uploads::root().DIRECTORY_SEPARATOR.$folder;
        File::ensureDirectoryExists($dir);
        imagejpeg($destino, $dir.DIRECTORY_SEPARATOR.$name, self::CALIDAD);
        imagedestroy($destino);

        return "/uploads/{$folder}/{$name}";
    }
}
