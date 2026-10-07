<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

/**
 * Archivos subidos por usuarios, guardados en public/uploads/<carpeta>/ y
 * servidos como estáticos en /uploads/<carpeta>/<archivo> (misma URL que en el
 * sitio anterior, así los `file_url` ya guardados en la base siguen andando).
 *
 * public/uploads/ está en .gitignore (salvo su .htaccess, que impide ejecutar
 * scripts ahí: en un hosting PHP, un archivo subido `.php` se ejecutaría).
 */
final class Uploads
{
    /** Extensiones permitidas para documentos (las que ofrece la UI). */
    public const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'webp'];

    public static function root(): string
    {
        return public_path('uploads');
    }

    /**
     * Guarda el archivo con un nombre seguro: `<milisegundos>_<nombre>.<ext>`,
     * nombre solo alfanumérico/guiones y extensión en minúsculas.
     *
     * @return string URL pública relativa (`/uploads/<carpeta>/<archivo>`)
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
     * apunten fuera de public/uploads (protección contra rutas con `..`).
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

        $path = realpath(public_path(ltrim($url, '/')));
        $root = realpath(self::root());

        if ($path === false || $root === false || ! is_file($path)) {
            return null;
        }

        return str_starts_with($path, $root.DIRECTORY_SEPARATOR) ? $path : null;
    }
}
