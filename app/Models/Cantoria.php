<?php

namespace App\Models;

use Database\Factories\CantoriaFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** Video de canto (cantoria). Se cargan a mano o sincronizando YouTube. */
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
