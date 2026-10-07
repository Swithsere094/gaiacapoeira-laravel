<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cabeceras de seguridad estándar en todas las respuestas (middleware
 * global: también cubre las páginas de error).
 *
 * No se agrega Content-Security-Policy: el sitio embebe videos de YouTube y
 * Vimeo y carga las tipografías locales; una CSP estricta requiere un
 * inventario fino de orígenes y se deja como mejora futura.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $headers = $response->headers;
        // El navegador no "adivina" tipos de contenido distintos al declarado.
        $headers->set('X-Content-Type-Options', 'nosniff');
        // Ningún sitio externo puede mostrar estas páginas dentro de un iframe.
        $headers->set('X-Frame-Options', 'SAMEORIGIN');
        // A sitios externos solo se les informa el dominio, no la ruta completa.
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // El sitio no usa cámara, micrófono ni ubicación.
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        // Solo por HTTPS: el navegador recuerda usar siempre HTTPS (1 año).
        if ($request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
