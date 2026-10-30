<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Movimiento de la contabilidad de un encuentro que anota el organizador:
 * un gasto o un ingreso que no viene de las inscripciones (patrocinio,
 * donación, venta…). El comprobante es opcional y va a la carpeta privada
 * de comprobantes.
 *
 * @property string $id
 * @property string $encuentro_id
 * @property string $tipo ingreso | gasto
 * @property CarbonImmutable $fecha
 * @property string $concepto
 * @property string $categoria
 * @property int $monto Pesos colombianos.
 * @property string|null $metodo
 * @property string|null $comprobante_url
 * @property string|null $nota
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read User|null $usuario
 */
class EncuentroMovimiento extends Model
{
    use HasUuids;

    public const INGRESO = 'ingreso';

    public const GASTO = 'gasto';

    /** Categorías de gastos (las ofrece el formulario). */
    public const CATEGORIAS_GASTO = [
        'Lugar', 'Invitados', 'Transporte', 'Alojamiento', 'Alimentación',
        'Camisetas y cordas', 'Materiales', 'Publicidad', 'Devoluciones', 'Otro',
    ];

    /** Categorías de otros ingresos (los de inscripciones se suman solos). */
    public const CATEGORIAS_INGRESO = ['Patrocinio', 'Donación', 'Venta', 'Otro'];

    protected $table = 'encuentro_movimientos';

    protected $fillable = [
        'encuentro_id', 'tipo', 'fecha', 'concepto', 'categoria', 'monto',
        'metodo', 'comprobante_url', 'nota', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'immutable_date:Y-m-d',
            'monto' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
