<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Un pago de una inscripción. Lo reporta quien se inscribe (`reportado`,
 * hasta que un organizador lo confirma o lo rechaza) o lo registra un
 * organizador (`confirmado`). Solo los confirmados suman a lo pagado.
 *
 * @property string $id
 * @property string $inscripcion_id
 * @property int $monto Pesos colombianos.
 * @property CarbonImmutable $fecha
 * @property string|null $metodo
 * @property string|null $comprobante_url
 * @property string|null $nota
 * @property string $estado reportado | confirmado | rechazado
 * @property string $origen participante | organizador
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Inscripcion $inscripcion
 */
class InscripcionPago extends Model
{
    use HasUuids;

    public const REPORTADO = 'reportado';

    public const CONFIRMADO = 'confirmado';

    public const RECHAZADO = 'rechazado';

    public const METODOS = ['Nequi', 'Daviplata', 'Transferencia', 'Efectivo', 'Otro'];

    /** Comprobantes: imagen o PDF, en una carpeta privada. */
    public const COMPROBANTE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    public const COMPROBANTE_FOLDER = 'comprobantes';

    protected $table = 'inscripcion_pagos';

    protected $fillable = [
        'inscripcion_id', 'monto', 'fecha', 'metodo', 'comprobante_url',
        'nota', 'estado', 'origen', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'integer',
            'fecha' => 'immutable_date:Y-m-d',
        ];
    }

    /** @return BelongsTo<Inscripcion, $this> */
    public function inscripcion(): BelongsTo
    {
        return $this->belongsTo(Inscripcion::class);
    }
}
