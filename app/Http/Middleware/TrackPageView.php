<?php

namespace App\Http\Middleware;

use App\Models\PageView;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Analíticas propias: registra una visita cada vez que se entrega una página.
 *
 * En el sitio anterior lo hacía el navegador con un POST a un endpoint
 * público (`/api/analytics/pageview`), que cualquiera podía llamar con rutas
 * inventadas. Acá lo registra el servidor al responder: mismo dato (ruta,
 * usuario si hay sesión, fecha), sin endpoint público ni forma de falsearlo.
 *
 * Cuenta solo páginas realmente mostradas: GET con respuesta 2xx que sea
 * una página (HTML o visita de Inertia), sin recargas parciales, prefetch,
 * redirecciones, archivos ni el chequeo de salud.
 */
class TrackPageView
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldTrack($request, $response)) {
            try {
                PageView::create([
                    'path' => mb_substr('/'.ltrim($request->path(), '/'), 0, 500),
                    'user_id' => $request->user()?->getAuthIdentifier(),
                ]);
            } catch (Throwable $e) {
                // Las analíticas nunca deben romper la navegación.
                report($e);
            }
        }

        return $response;
    }

    private function shouldTrack(Request $request, Response $response): bool
    {
        if (! $request->isMethod('GET') || ! $response->isSuccessful()) {
            return false;
        }

        if ($request->is('up')) {
            return false;
        }

        // Recarga parcial de Inertia (solo algunas props) o prefetch: no es una visita.
        if ($request->hasHeader('X-Inertia-Partial-Data') || $request->hasHeader('X-Inertia-Partial-Component')) {
            return false;
        }

        if ($request->header('Purpose') === 'prefetch' || $request->header('Sec-Purpose') === 'prefetch') {
            return false;
        }

        $isInertia = $response->headers->get('X-Inertia') === 'true';
        $isHtml = str_contains((string) $response->headers->get('Content-Type'), 'text/html');

        return $isInertia || $isHtml;
    }
}
