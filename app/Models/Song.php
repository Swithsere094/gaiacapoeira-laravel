<?php

namespace App\Models;

use Database\Factories\SongFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Canción del cancionero "Sabiá cantou".
 *
 * `tags` guarda los ritmos (toques del berimbau) como lista JSON.
 * `nossa` marca las canciones propias del grupo o de un integrante: al
 * crear la puede marcar cualquier sesión; al editar, solo un admin.
 */
class Song extends Model
{
    /** @use HasFactory<SongFactory> */
    use HasFactory, HasUuids;

    public const TYPES = ['ladainha', 'corrido', 'quadra', 'chula', 'samba'];

    protected $fillable = [
        'title', 'type', 'lyrics', 'translation', 'context',
        'video_url', 'audio_url', 'mestre', 'tags', 'nossa', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'nossa' => 'boolean',
        ];
    }
}
