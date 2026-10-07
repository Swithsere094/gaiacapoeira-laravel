<?php

namespace App\Models;

use Database\Factories\PoliticaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Documento de política interna. `file_url` es una URL pública relativa
 * (`/uploads/politica/<archivo>`) que se guardó así desde el sitio anterior:
 * los archivos se siguen sirviendo en esa misma ruta para no romperla.
 */
class Politica extends Model
{
    /** @use HasFactory<PoliticaFactory> */
    use HasFactory, HasUuids;

    protected $table = 'politica';

    protected $fillable = ['title', 'content', 'category', 'file_url', 'file_name'];
}
