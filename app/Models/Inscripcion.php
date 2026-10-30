<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Inscripción a un encuentro, hecha sin cuenta desde la página pública.
 *
 * `codigo` se muestra en la confirmación (para la captura) y en el panel;
 * `token` arma el enlace privado para volver a consultarla. La opción de
 * precio elegida se copia (`precio_nombre`, `precio_valor`).
 *
 * @property string $id
 * @property string $encuentro_id
 * @property string $codigo
 * @property string $token
 * @property string $nombre
 * @property string|null $apelido
 * @property string $grupo
 * @property string|null $profesor
 * @property string|null $graduacion
 * @property string $ciudad
 * @property string $telefono
 * @property string|null $email
 * @property string|null $talla
 * @property string $emergencia_nombre
 * @property string $emergencia_telefono
 * @property string|null $precio_id
 * @property string $precio_nombre
 * @property int $precio_valor
 * @property string $pago_estado pendiente | parcial | pagado
 * @property int $monto_pagado
 * @property string $estado activa | cancelada
 * @property string|null $notas
 * @property Carbon $consentimiento_at
 * @property string $locale
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Encuentro $encuentro
 */
class Inscripcion extends Model
{
    use HasUuids;

    public const ACTIVA = 'activa';

    public const CANCELADA = 'cancelada';

    public const PAGO_ESTADOS = ['pendiente', 'parcial', 'pagado'];

    public const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    /** Sin 0/O ni 1/I/L: se leen mal en una captura. */
    private const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    protected $table = 'inscripciones';

    protected $fillable = [
        'encuentro_id', 'codigo', 'token', 'nombre', 'apelido', 'grupo',
        'profesor', 'graduacion', 'ciudad', 'telefono', 'email', 'talla',
        'emergencia_nombre', 'emergencia_telefono', 'precio_id',
        'precio_nombre', 'precio_valor', 'pago_estado', 'monto_pagado',
        'estado', 'notas', 'consentimiento_at', 'locale',
    ];

    protected function casts(): array
    {
        return [
            'precio_valor' => 'integer',
            'monto_pagado' => 'integer',
            'consentimiento_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Encuentro, $this> */
    public function encuentro(): BelongsTo
    {
        return $this->belongsTo(Encuentro::class);
    }

    /** Código corto nuevo, tipo `K7Q2-9XMA`. */
    public static function nuevoCodigo(): string
    {
        do {
            $chars = '';
            for ($i = 0; $i < 8; $i++) {
                $chars .= self::CODE_CHARS[random_int(0, strlen(self::CODE_CHARS) - 1)];
            }
            $codigo = substr($chars, 0, 4).'-'.substr($chars, 4);
        } while (self::where('codigo', $codigo)->exists());

        return $codigo;
    }

    public static function nuevoToken(): string
    {
        return Str::random(48);
    }

    /** Lo que falta pagar (nunca negativo). */
    public function saldo(): int
    {
        return max(0, $this->precio_valor - $this->monto_pagado);
    }
}
