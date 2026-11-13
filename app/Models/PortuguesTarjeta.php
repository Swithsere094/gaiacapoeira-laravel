<?php

namespace App\Models;

use App\Support\Repaso;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Lo de una persona con una palabra: cómo le suena, su asociación
 * inverosímil (o una frase, para palabras abstractas) y su repaso espaciado.
 * Las reglas del repaso están en App\Support\Repaso.
 *
 * Estado: "aprendida" si el repaso ya la manda a 21 días o más
 * (Repaso::APRENDIDA); si no, "con asociación" si tiene asociación o frase;
 * si no, "sin trabajar".
 *
 * @property string $id
 * @property string $user_id
 * @property string $palabra_id
 * @property string|null $suena_como
 * @property string|null $asociacion
 * @property string|null $frase
 * @property int $intervalo días hasta el próximo repaso
 * @property float $facilidad multiplicador del intervalo (como en Anki)
 * @property int $repeticiones repasos seguidos sin "Otra vez"
 * @property CarbonImmutable|null $proximo_repaso
 * @property CarbonImmutable|null $repasada_on
 * @property CarbonImmutable|null $saltada_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read PortuguesPalabra $palabra
 * @property-read User $user
 */
class PortuguesTarjeta extends Model
{
    use HasUuids;

    public const SIN_TRABAJAR = 'sin_trabajar';

    public const CON_ASOCIACION = 'con_asociacion';

    public const APRENDIDA = 'aprendida';

    protected $table = 'portugues_tarjetas';

    protected $fillable = [
        'user_id', 'palabra_id', 'suena_como', 'asociacion', 'frase',
        'intervalo', 'facilidad', 'repeticiones', 'proximo_repaso', 'repasada_on', 'saltada_at',
    ];

    protected $attributes = [
        'intervalo' => 0,
        'facilidad' => 2.5,
        'repeticiones' => 0,
    ];

    protected function casts(): array
    {
        return [
            'intervalo' => 'integer',
            'facilidad' => 'float',
            'repeticiones' => 'integer',
            'proximo_repaso' => 'immutable_date:Y-m-d',
            'repasada_on' => 'immutable_date:Y-m-d',
            'saltada_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<PortuguesPalabra, $this> */
    public function palabra(): BelongsTo
    {
        return $this->belongsTo(PortuguesPalabra::class, 'palabra_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tieneAsociacion(): bool
    {
        return filled($this->asociacion) || filled($this->frase);
    }

    public function estado(): string
    {
        return match (true) {
            $this->intervalo >= Repaso::APRENDIDA => self::APRENDIDA,
            $this->tieneAsociacion() => self::CON_ASOCIACION,
            default => self::SIN_TRABAJAR,
        };
    }
}
