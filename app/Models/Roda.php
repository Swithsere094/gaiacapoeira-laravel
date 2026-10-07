<?php

namespace App\Models;

use Database\Factories\RodaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Video de una roda (evento). Se cargan a mano o sincronizando YouTube.
 *
 * @property string $id
 * @property string $title
 * @property string|null $description
 * @property string $video_url
 * @property string|null $thumbnail_url
 * @property string|null $location
 * @property Carbon|null $event_date
 * @property int|null $duration
 * @property list<string>|null $participants
 * @property list<string>|null $tags
 * @property int $views
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Roda extends Model
{
    /** @use HasFactory<RodaFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'title', 'description', 'video_url', 'thumbnail_url', 'location',
        'event_date', 'duration', 'participants', 'tags', 'views', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date:Y-m-d',
            'duration' => 'integer',
            'participants' => 'array',
            'tags' => 'array',
            'views' => 'integer',
        ];
    }
}
