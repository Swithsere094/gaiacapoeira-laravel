<?php

namespace App\Models;

use App\Models\Concerns\Traducible;
use Carbon\CarbonImmutable;
use Database\Factories\EncuentroFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Encuentro del grupo (batizado…) con página pública en
 * `{slug}.gaiacapoeira.com` e inscripción sin cuenta.
 *
 * Estados: borrador (solo lo ve quien gestiona) → publicado (página e
 * inscripciones abiertas, salvo fechas o cupo) → cerrado (página visible,
 * sin inscripciones) → terminado (recuerdo: mensaje de cierre y fotos) →
 * archivado (sin página: se borró el subdominio; los datos quedan).
 *
 * @property string $id
 * @property string $slug
 * @property string $nombre
 * @property CarbonImmutable $starts_on
 * @property CarbonImmutable|null $ends_on
 * @property string|null $lugar
 * @property string|null $direccion Para el mapa de la página pública.
 * @property string|null $mapa_url
 * @property string|null $descripcion
 * @property string|null $info_pago
 * @property string|null $mensaje_final Se muestra cuando está terminado.
 * @property string|null $portada_url
 * @property int|null $cupo
 * @property CarbonImmutable|null $inscripciones_desde
 * @property CarbonImmutable|null $inscripciones_hasta
 * @property string $estado
 * @property string $subdominio ninguno | creado | error
 * @property array<mixed>|null $respuesta_api
 * @property string|null $evento_id
 * @property string|null $user_id
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property-read Collection<int, EncuentroPrecio> $precios
 * @property-read Collection<int, Inscripcion> $inscripciones
 * @property-read Collection<int, EncuentroActividad> $actividades
 * @property-read Collection<int, EncuentroInvitado> $invitados
 * @property-read Collection<int, EncuentroFoto> $fotos
 * @property-read Evento|null $evento
 * @property-read int|null $inscripciones_count Con withCount('inscripciones').
 */
class Encuentro extends Model
{
    /** @use HasFactory<EncuentroFactory> */
    use HasFactory, HasUuids, Traducible;

    /** Campos que el organizador puede traducir (portugués e inglés). */
    public const TRADUCIBLES = ['nombre', 'descripcion', 'info_pago', 'mensaje_final'];

    public const BORRADOR = 'borrador';

    public const PUBLICADO = 'publicado';

    public const CERRADO = 'cerrado';

    public const TERMINADO = 'terminado';

    public const ARCHIVADO = 'archivado';

    public const ESTADOS = [self::BORRADOR, self::PUBLICADO, self::CERRADO, self::TERMINADO, self::ARCHIVADO];

    /**
     * Subdominios que no se pueden usar: los de servicios del hosting y los
     * del sitio. Tampoco los atienden las rutas por subdominio.
     */
    public const RESERVADOS = [
        'www', 'mail', 'admin', 'api', 'ftp', 'cpanel', 'webmail', 'smtp',
        'pop', 'imap', 'ns1', 'ns2', 'autodiscover',
    ];

    protected $fillable = [
        'slug', 'nombre', 'starts_on', 'ends_on', 'lugar', 'direccion', 'mapa_url',
        'descripcion', 'info_pago', 'mensaje_final', 'portada_url', 'cupo',
        'inscripciones_desde', 'inscripciones_hasta', 'estado',
        'subdominio', 'respuesta_api', 'evento_id', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'immutable_date:Y-m-d',
            'ends_on' => 'immutable_date:Y-m-d',
            'inscripciones_desde' => 'immutable_date:Y-m-d',
            'inscripciones_hasta' => 'immutable_date:Y-m-d',
            'cupo' => 'integer',
            'respuesta_api' => 'array',
        ];
    }

    /** @return HasMany<EncuentroPrecio, $this> */
    public function precios(): HasMany
    {
        return $this->hasMany(EncuentroPrecio::class)->orderBy('sort_order');
    }

    /**
     * Programación: por día, después por hora (sin hora primero) y orden del formulario.
     *
     * @return HasMany<EncuentroActividad, $this>
     */
    public function actividades(): HasMany
    {
        return $this->hasMany(EncuentroActividad::class)->orderBy('fecha')->orderBy('hora_inicio')->orderBy('sort_order');
    }

    /** @return HasMany<EncuentroInvitado, $this> */
    public function invitados(): HasMany
    {
        return $this->hasMany(EncuentroInvitado::class)->orderBy('sort_order');
    }

    /** @return HasMany<EncuentroFoto, $this> */
    public function fotos(): HasMany
    {
        return $this->hasMany(EncuentroFoto::class)->orderBy('sort_order');
    }

    /** @return HasMany<Inscripcion, $this> */
    public function inscripciones(): HasMany
    {
        return $this->hasMany(Inscripcion::class);
    }

    /** @return BelongsTo<Evento, $this> */
    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    /** Dirección pública en su subdominio. */
    public function url(): string
    {
        return 'https://'.$this->slug.'.'.config('services.hostinger.domain');
    }

    /** La página pública se ve (publicado, cerrado o terminado). */
    public function esVisible(): bool
    {
        return in_array($this->estado, [self::PUBLICADO, self::CERRADO, self::TERMINADO], true);
    }

    /**
     * Por qué no se aceptan inscripciones hoy (en hora de Colombia), o null
     * si están abiertas: `cerrado` (estado), `antes` / `despues` (fechas) o
     * `cupo` (lleno).
     */
    public function motivoCierre(CarbonImmutable $today): ?string
    {
        if ($this->estado !== self::PUBLICADO) {
            return 'cerrado';
        }

        if ($this->inscripciones_desde && $today->lt($this->inscripciones_desde)) {
            return 'antes';
        }

        if ($this->inscripciones_hasta && $today->gt($this->inscripciones_hasta)) {
            return 'despues';
        }

        if ($this->cupo !== null && $this->inscripcionesActivas() >= $this->cupo) {
            return 'cupo';
        }

        return null;
    }

    public function inscripcionesActivas(): int
    {
        return $this->inscripciones()->where('estado', Inscripcion::ACTIVA)->count();
    }
}
