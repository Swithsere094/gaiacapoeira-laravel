<?php

namespace App\Http\Controllers;

use App\Models\Habilidad;
use App\Support\ArbolView;
use App\Support\RetosDemo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** El árbol de habilidades propio (demo de retos, solo admins). */
class ArbolController extends Controller
{
    public function show(Request $request): Response
    {
        $tree = self::tree($request);

        return Inertia::render('retos/arbol', [
            'tree' => $tree,
            'nodes' => ArbolView::nodes(RetosDemo::progreso($request), $tree),
            // ?habilidad=<id>: abre esa habilidad (al volver de un entrenamiento).
            'selected' => $request->string('habilidad')->toString() ?: null,
            'pending_reviews' => ArbolView::pendingReviews(),
            'demo' => RetosDemo::toArray($request),
        ]);
    }

    /** ?arbol=movimiento|musicalidad (por defecto, movimiento). */
    public static function tree(Request $request): string
    {
        $tree = $request->string('arbol')->toString();

        return in_array($tree, Habilidad::TREES, true) ? $tree : Habilidad::MOVIMIENTO;
    }
}
