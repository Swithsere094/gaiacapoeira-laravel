<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\PreventCaching;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\TrackPageView;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo('/auth/login');
        $middleware->redirectUsersTo('/');

        $middleware->alias(['admin' => EnsureUserIsAdmin::class]);

        // Sin trustProxies('*') a propósito: devolvería la PRIMERA IP de
        // X-Forwarded-For, que el visitante puede inventar. La IP para los
        // límites de intentos la resuelve App\Support\ClientIp.

        $middleware->append(SecurityHeaders::class);

        // Primero del grupo = último en tocar la respuesta: así su
        // Cache-Control no lo pisa el middleware de sesión.
        $middleware->web(prepend: [PreventCaching::class]);

        $middleware->web(append: [
            TrackPageView::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || ($request->expectsJson() && ! $request->header('X-Inertia')),
        );

        // Páginas de error propias (resources/js/pages/error.tsx) para los
        // errores que la app puede devolver. Si la página de React no se
        // puede mostrar, queda la respuesta original de Laravel, que usa las
        // versiones en HTML puro de resources/views/errors/.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();

            if (! in_array($status, [403, 404, 405, 413, 419, 429, 500, 503], true)) {
                return $response;
            }

            // En desarrollo, el 500 sigue mostrando el detalle técnico.
            if ($status === 500 && config('app.debug')) {
                return $response;
            }

            // Clientes que piden JSON (no Inertia) reciben el JSON de Laravel.
            if ($request->expectsJson() && ! $request->header('X-Inertia')) {
                return $response;
            }

            try {
                $page = Inertia::render('error', ['status' => $status])->toResponse($request);
            } catch (Throwable) {
                return $response;
            }

            $page->setStatusCode($status);
            $page->headers->set('Cache-Control', 'private, no-store');
            // Laravel indica cuándo reintentar en 429/503: se conserva.
            if ($response->headers->has('Retry-After')) {
                $page->headers->set('Retry-After', (string) $response->headers->get('Retry-After'));
            }

            return $page;
        });
    })->create();
