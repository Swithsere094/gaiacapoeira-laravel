<?php

namespace App\Models;

use Database\Factories\RodaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** Video de una roda (evento). Se cargan a mano o sincronizando YouTube. */
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
