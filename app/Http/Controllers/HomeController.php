<?php

namespace App\Http\Controllers;

use App\Models\RetoSemana;
use App\Support\Celebraciones;
use App\Support\EventCalendar;
use App\Support\RetosAcceso;
use App\Support\RetosDemo;
use App\Support\RetosView;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inicio: las tarjetas de secciones, los retos en curso (con el permiso de
 * Entrenar o del árbol) y el calendario del mes (solo ver).
 */
class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('home', [
            'calendar' => EventCalendar::build('mes', $request->string('fecha')->toString() ?: null, $request->user()),
            'retos' => RetosAcceso::misRetos($request->user()) ? $this->retos($request) : null,
        ]);
    }

    /** @return array{active: list<array<string, mixed>>, today: string, progress: array<string, array{done: int, total: int}>|null, celebrations: list<array<string, mixed>>} */
    private function retos(Request $request): array
    {
        $progreso = RetosDemo::progreso($request);

        return [
            'active' => array_values(RetosAcceso::activeWeeks($progreso)
                ->map(fn (RetoSemana $s) => RetosView::activeWeek($s, $progreso->today))
                ->all()),
            'today' => $progreso->today->toDateString(),
            'progress' => RetosAcceso::arbol($request->user()) ? $progreso->treeProgress() : null,
            'celebrations' => Celebraciones::pull($progreso),
        ];
    }
}
