<?php

namespace App\Models;

use Database\Factories\CantoriaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Video de canto (cantoria). Se cargan a mano o sincronizando YouTube.
 *
 * @property string $id
 * @property string $title
 * @property string|null $video_url
 * @property string|null $description
 * @property Carbon|null $event_date
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class Cantoria extends Model
{
    /** @use HasFactory<CantoriaFactory> */
    use HasFactory, HasUuids;

    protected $table = 'cantorias';

    protected $fillable = ['title', 'video_url', 'description', 'event_date'];

    protected function casts(): array
    {
        return [
            'event_date' => 'date:Y-m-d',
        ];
    }
}
