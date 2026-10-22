<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Subdominios de gaiacapoeira.com con la API oficial de Hostinger
 * (developers.hostinger.com, especificación OpenAPI pública).
 *
 * Los subdominios se crean con `is_using_public_directory: true`: usan la
 * misma carpeta pública que el sitio principal (public_html → current/public),
 * así que los atiende esta app sin crear ni copiar carpetas. Hostinger
 * responde "Request accepted": recibió el pedido, el DNS y el SSL pueden
 * tardar un poco más.
 *
 * Cada petición y respuesta queda en storage/logs/hostinger.log, nunca con el
 * token (va solo en la cabecera Authorization, que no se registra).
 */
class HostingerClient
{
    /**
     * @return array{ok: bool, status: int|null, body: mixed}
     */
    public function crearSubdominio(string $slug): array
    {
        return $this->send('post', $this->subdomainsPath(), [
            'subdomain' => $slug,
            'is_using_public_directory' => true,
        ]);
    }

    /**
     * @return array{ok: bool, status: int|null, body: mixed}
     */
    public function eliminarSubdominio(string $slug): array
    {
        return $this->send('delete', $this->subdomainsPath().'/'.rawurlencode($slug));
    }

    /** Si están las variables necesarias para llamar a la API. */
    public static function configurado(): bool
    {
        return filled(config('services.hostinger.token'))
            && filled(config('services.hostinger.username'))
            && filled(config('services.hostinger.domain'));
    }

    private function subdomainsPath(): string
    {
        return sprintf(
            '/api/hosting/v1/accounts/%s/websites/%s/subdomains',
            rawurlencode((string) config('services.hostinger.username')),
            rawurlencode((string) config('services.hostinger.domain')),
        );
    }

    /**
     * @param  'post'|'delete'  $method
     * @param  array<string, mixed>  $payload
     * @return array{ok: bool, status: int|null, body: mixed}
     */
    private function send(string $method, string $path, array $payload = []): array
    {
        $log = Log::channel('hostinger');

        if (! self::configurado()) {
            $log->warning('Petición no enviada: faltan variables HOSTINGER_*', ['method' => strtoupper($method), 'path' => $path]);

            return ['ok' => false, 'status' => null, 'body' => ['message' => 'Faltan variables de entorno HOSTINGER_API_TOKEN, HOSTINGER_USERNAME o HOSTINGER_DOMAIN']];
        }

        $log->info('Petición', ['method' => strtoupper($method), 'path' => $path, 'payload' => $payload]);

        try {
            $response = $method === 'post'
                ? $this->http()->post($path, $payload)
                : $this->http()->delete($path);
        } catch (ConnectionException $e) {
            $log->error('Sin respuesta', ['method' => strtoupper($method), 'path' => $path, 'error' => $e->getMessage()]);

            return ['ok' => false, 'status' => null, 'body' => ['message' => 'No se pudo conectar con la API de Hostinger: '.$e->getMessage()]];
        }

        $body = $response->json() ?? $response->body();

        $log->log($response->successful() ? 'info' : 'error', 'Respuesta', [
            'method' => strtoupper($method),
            'path' => $path,
            'status' => $response->status(),
            'body' => $body,
        ]);

        return ['ok' => $response->successful(), 'status' => $response->status(), 'body' => $body];
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl((string) config('services.hostinger.url'))
            ->withToken((string) config('services.hostinger.token'))
            ->acceptJson()
            ->asJson()
            ->timeout(30);
    }
}
