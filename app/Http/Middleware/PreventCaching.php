<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `Cache-Control: private, no-store` en todas las respuestas de la app.
 *
 * Hostinger pone un CDN delante del sitio que, en el sitio anterior, llegó a
 * cachear el HTML de páginas protegidas sin mirar la cookie de sesión: un
 * visitante sin sesión podía recibir contenido de otro (ver CLAUDE.md,
 * gotcha del CDN). Los assets compilados (/build) no pasan por acá.
 */
class PreventCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('Cache-Control', 'private, no-store');

        return $response;
    }
}
