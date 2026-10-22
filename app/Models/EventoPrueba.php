<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Evento de la prueba de concepto de subdominios: cada uno se ve en
 * `{slug}.gaiacapoeira.com` (y en `/eventos-prueba/{slug}`), atendido por
 * esta misma app. El subdominio lo crea App\Services\HostingerClient.
 *
 * @property string $id
 * @property string $nombre
 * @property string $slug
 * @property string $estado pendiente | creado | error
 * @property array<mixed>|null $respuesta_api
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class EventoPrueba extends Model
{
    use HasUuids;

    public const PENDIENTE = 'pendiente';

    public const CREADO = 'creado';

    public const ERROR = 'error';

    /**
     * Subdominios que no se pueden usar: los de servicios del hosting y los
     * del sitio. Tampoco los atienden las rutas por subdominio.
     */
    public const RESERVADOS = [
        'www', 'mail', 'admin', 'api', 'ftp', 'cpanel', 'webmail', 'smtp',
        'pop', 'imap', 'ns1', 'ns2', 'autodiscover',
    ];

    protected $table = 'eventos_prueba';

    protected $fillable = ['nombre', 'slug', 'estado', 'respuesta_api'];

    protected function casts(): array
    {
        return [
            'respuesta_api' => 'array',
        ];
    }

    /** Dirección pública del evento en su subdominio. */
    public function subdominioUrl(): string
    {
        return 'https://'.$this->slug.'.'.config('services.hostinger.domain');
    }
}
