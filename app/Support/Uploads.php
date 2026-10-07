<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

/**
 * Archivos subidos por usuarios (documentos de política).
 *
 * Se guardan en storage/app/uploads/<carpeta>/, FUERA de public/, y se
 * sirven con la ruta `GET /uploads/{path}` (UploadController), que exige
 * sesión. La URL pública sigue siendo `/uploads/<carpeta>/<archivo>`, igual
 * que en el sitio anterior, así los `file_url` ya guardados siguen andando.
 *
 * Por qué no en public/: lo que está en public/ lo entrega el servidor web
 * directo, sin pasar por Laravel ni por el login (en el sitio Next sí pasaba
 * por el filtro de sesión). Y fuera de public/ un archivo subido nunca se
 * puede ejecutar como código.
 */
final class Uploads
{
    /** Extensiones permitidas para documentos (las que ofrece la UI). */
    public const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];

    public static function root(): string
    {
        return (string) config('filesystems.uploads_root', storage_path('app/uploads'));
    }

    /**
     * Guarda el archivo con un nombre seguro: `<milisegundos>_<nombre>.<ext>`,
     * nombre solo alfanumérico/guiones y extensión en minúsculas.
     *
     * @return string URL relativa (`/uploads/<carpeta>/<archivo>`)
     */
    public static function store(UploadedFile $file, string $folder): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $base = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safe = substr((string) preg_replace('/[^a-zA-Z0-9_-]/u', '_', $base), 0, 60) ?: 'archivo';
        $name = (int) floor(microtime(true) * 1000).'_'.$safe.'.'.$extension;

        $file->move(self::root().DIRECTORY_SEPARATOR.$folder, $name);

        return "/uploads/{$folder}/{$name}";
    }

    /**
     * Borra el archivo de una URL `/uploads/...`. Ignora URLs externas o que
     * apunten fuera de la carpeta de subidas (protección contra `..`).
     */
    public static function delete(?string $url): void
    {
        $path = self::pathFor($url);

        if ($path !== null) {
            File::delete($path);
        }
    }

    /** Ruta real en disco de una URL `/uploads/...`, o null si no es válida. */
    public static function pathFor(?string $url): ?string
    {
        if (! $url || ! str_starts_with($url, '/uploads/')) {
            return null;
        }

        $relative = substr($url, strlen('/uploads/'));
        $path = realpath(self::root().DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $relative));
        $root = realpath(self::root());

        if ($path === false || $root === false || ! is_file($path)) {
            return null;
        }

        return str_starts_with($path, $root.DIRECTORY_SEPARATOR) ? $path : null;
    }
}
