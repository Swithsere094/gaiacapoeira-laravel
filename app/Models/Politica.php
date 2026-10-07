<?php

namespace App\Models;

use Database\Factories\PoliticaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Documento de política interna. `file_url` es una URL pública relativa
 * (`/uploads/politica/<archivo>`) que se guardó así desde el sitio anterior:
 * los archivos se siguen sirviendo en esa misma ruta para no romperla.
 *
 * @property string $id
 * @property string $title
 * @property string|null $content
 * @property string|null $category
 * @property string|null $file_url
 * @property string|null $file_name
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Politica extends Model
{
    /** @use HasFactory<PoliticaFactory> */
    use HasFactory, HasUuids;

    protected $table = 'politica';

    protected $fillable = ['title', 'content', 'category', 'file_url', 'file_name'];
}
