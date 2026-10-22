<?php

namespace App\Http\Middleware;

use App\Models\EventoPrueba;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Busca el EventoPrueba por el slug de la ruta (`{evento}`: el subdominio, o
 * el segmento de /eventos-prueba/{evento}). Si no existe, 404. El evento
 * queda en el atributo `eventoPrueba` de la petición.
 */
class ResolveEventoPrueba
{
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('evento');

        $evento = is_string($slug) ? EventoPrueba::where('slug', $slug)->first() : null;
        abort_if($evento === null, 404);

        $request->attributes->set('eventoPrueba', $evento);

        return $next($request);
    }
}
