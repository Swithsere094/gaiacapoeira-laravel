<?php

namespace App\Models;

use Database\Factories\SongFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Canción del cancionero "Sabiá cantou".
 *
 * `tags` guarda los ritmos (toques del berimbau) como lista JSON.
 * `nossa` marca las canciones propias del grupo o de un integrante: al
 * crear la puede marcar cualquier sesión; al editar, solo un admin.
 *
 * @property string $id
 * @property string $title
 * @property string $type
 * @property string $lyrics
 * @property string|null $translation
 * @property string|null $context
 * @property string|null $video_url
 * @property string|null $audio_url
 * @property string|null $mestre
 * @property list<string>|null $tags
 * @property bool $nossa
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
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
