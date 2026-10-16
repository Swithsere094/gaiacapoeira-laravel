<?php

namespace App\Http\Controllers;

use App\Support\EventCalendar;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** Inicio: las tarjetas de secciones y el calendario del mes (solo ver). */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('home', [
            'calendar' => EventCalendar::build('mes', $request->string('fecha')->toString() ?: null, $request->user()),
        ]);
    }
}
