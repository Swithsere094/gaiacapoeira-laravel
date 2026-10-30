<?php

namespace App\Http\Middleware;

use App\Models\Encuentro;
use App\Support\EncuentroIdioma;
use App\Support\Permissions;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Páginas públicas de un encuentro, en su subdominio
 * (`{encuentro}.gaiacapoeira.com`) o en el respaldo `/e/{encuentro}`.
 *
 * Busca el encuentro por el slug de la ruta: 404 si no existe o si es un
 * borrador (salvo para quien gestiona encuentros, que lo previsualiza por
 * `/e/…` con su sesión). Deja en la petición el encuentro y la base de las
 * direcciones de la página (`''` en el subdominio, `/e/slug` en el respaldo),
 * y saca el slug de los parámetros para que no llegue a los controladores.
 * Las respuestas llevan `noindex` (decisión del usuario: no indexar).
 *
 * También fija el idioma (EncuentroIdioma) y comparte con las páginas los
 * textos de la interfaz en ese idioma (`idioma`).
 */
class ResolveEncuentro
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        $slug = $route?->parameter('encuentro');
        $encuentro = is_string($slug) ? Encuentro::where('slug', $slug)->first() : null;

        abort_if($encuentro === null, 404);
        abort_if(! $encuentro->esVisible() && ! $request->user()?->can(Permissions::ENCUENTROS_GESTIONAR), 404);

        $request->attributes->set('encuentro', $encuentro);
        $request->attributes->set('encuentro_base', $route->getDomain() ? '' : '/e/'.$encuentro->slug);
        $route->forgetParameter('encuentro');

        app()->setLocale(EncuentroIdioma::detectar($request));
        // Con closure: la consulta de una inscripción puede cambiar el idioma después.
        Inertia::share('idioma', fn () => [
            'actual' => app()->getLocale(),
            'disponibles' => EncuentroIdioma::LOCALES,
            'textos' => __('encuentro.ui'),
        ]);

        $response = $next($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow');

        return $response;
    }
}
