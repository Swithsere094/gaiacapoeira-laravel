<?php

namespace App\Http\Controllers;

use App\Models\Habilidad;
use App\Models\User;
use App\Support\ArbolView;
use App\Support\Progreso;
use App\Support\RetosAcceso;
use App\Support\RetosDemo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Marcar a mano las habilidades dominadas de una persona (por ejemplo, un
 * graduado que llega al grupo).
 *
 *  - marcar una habilidad marca también todos sus requisitos;
 *  - quitarla quita también las que dependen de ella;
 *
 * así el árbol nunca queda con una habilidad dominada sin sus requisitos.
 *
 * El admin ve y marca el árbol de cualquiera, también el suyo (así prepara
 * los árboles antes de liberarlos); el resto, solo el de otras personas que
 * tengan el árbol (RetosAcceso::canReview).
 */
class PersonaController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('retos/personas', [
            'people' => RetosAcceso::people($request->user())->withCount('habilidadesDominadas')->orderBy('name')->get()
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'apodo' => $u->apodo,
                    'username' => $u->username,
                    'role_name' => $u->rol->name ?? 'Miembro',
                    'dominated' => (int) $u->getAttribute('habilidades_dominadas_count'),
                ])
                ->values(),
            'total' => Habilidad::count(),
            'pending_reviews' => ArbolView::pendingReviews($request->user()),
        ]);
    }

    public function show(Request $request, User $user): Response
    {
        abort_unless(RetosAcceso::canReview($request->user(), $user), 403);
        $tree = ArbolController::tree($request);

        return Inertia::render('retos/persona', [
            'person' => ['id' => $user->id, 'name' => $user->name, 'apodo' => $user->apodo],
            'tree' => $tree,
            'nodes' => ArbolView::nodes(new Progreso($user, RetosDemo::today($request)), $tree),
            'pending_reviews' => ArbolView::pendingReviews($request->user()),
        ]);
    }

    public function mark(Request $request, User $user, Habilidad $habilidad): RedirectResponse
    {
        abort_unless(RetosAcceso::canReview($request->user(), $user), 403);
        $progreso = new Progreso($user, RetosDemo::today($request));

        if ($progreso->isDominated($habilidad->id)) {
            return back()->with('error', "{$user->name} ya domina «{$habilidad->name}».");
        }

        $ids = array_values(array_filter(
            [$habilidad->id, ...$progreso->ancestorsOf($habilidad->id)],
            fn (string $id) => ! $progreso->isDominated($id),
        ));

        $user->habilidadesDominadas()->attach(array_fill_keys($ids, [
            'source' => 'manual',
            'granted_by' => $request->user()->id,
            'created_at' => now(),
        ]));

        $extra = count($ids) - 1;

        return back()->with('success', "«{$habilidad->name}» quedó dominada para {$user->name}"
            .($extra > 0 ? ($extra === 1 ? ' (y 1 requisito).' : " (y {$extra} requisitos).") : '.'));
    }

    public function unmark(Request $request, User $user, Habilidad $habilidad): RedirectResponse
    {
        abort_unless(RetosAcceso::canReview($request->user(), $user), 403);
        $progreso = new Progreso($user, RetosDemo::today($request));

        if (! $progreso->isDominated($habilidad->id)) {
            return back()->with('error', "{$user->name} no domina «{$habilidad->name}».");
        }

        $ids = array_values(array_filter(
            [$habilidad->id, ...$progreso->descendantsOf($habilidad->id)],
            fn (string $id) => $progreso->isDominated($id),
        ));

        $user->habilidadesDominadas()->detach($ids);

        $extra = count($ids) - 1;

        return back()->with('success', "Quitaste «{$habilidad->name}» a {$user->name}"
            .($extra > 0 ? ($extra === 1 ? ' (y 1 que dependía de ella).' : " (y {$extra} que dependían de ella).") : '.'));
    }
}
