<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Página pública de un evento de prueba, en su subdominio o en
 * /eventos-prueba/{slug}. El evento lo resuelve ResolveEventoPrueba.
 */
class EventoPruebaPaginaController extends Controller
{
    public function __invoke(Request $request): View
    {
        return view('eventos-prueba.show', ['evento' => $request->attributes->get('eventoPrueba')]);
    }
}
