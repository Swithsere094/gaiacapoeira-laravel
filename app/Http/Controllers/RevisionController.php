<?php

namespace App\Http\Controllers;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\Revision;
use App\Support\ArbolView;
use App\Support\RetosDemo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Revisiones del reto secreto: la persona la pide cuando se siente segura;
 * un admin la aprueba (la habilidad queda dominada) o la rechaza con un
 * comentario (se puede volver a pedir de inmediato).
 *
 * Demo: los admins pueden revisar su propio pedido (decisión del usuario:
 * son dos y trabajan con palabra de honor). Al abrirlo a profesores (fase E),
 * un profesor no podrá revisar los suyos.
 */
class RevisionController extends Controller
{
    public function request(Request $request, Habilidad $habilidad): RedirectResponse
    {
        if ($reason = RetosDemo::progreso($request)->cannotRequestReview($habilidad->id)) {
            return back()->with('error', $reason);
        }

        Revision::create([
            'user_id' => $request->user()->id,
            'habilidad_id' => $habilidad->id,
            'status' => Revision::PENDIENTE,
        ]);

        return back()->with('success', "Pediste la revisión de «{$habilidad->name}». Un admin la va a revisar.");
    }

    public function index(): Response
    {
        $map = fn (Revision $r) => [
            'id' => $r->id,
            'status' => $r->status,
            'comment' => $r->comment,
            'requested_on' => $r->created_at->toDateString(),
            'reviewed_on' => $r->reviewed_at?->toDateString(),
            'reviewer' => $r->reviewer?->name,
            'user' => ['id' => $r->user->id, 'name' => $r->user->name, 'apodo' => $r->user->apodo],
            'habilidad' => ['id' => $r->habilidad->id, 'name' => $r->habilidad->name, 'tree' => $r->habilidad->tree],
            'sessions' => $this->secretSessions($r),
        ];

        $with = ['user:id,name,apodo', 'habilidad:id,name,tree', 'reviewer:id,name'];

        return Inertia::render('retos/revisiones', [
            'pending' => Revision::with($with)->where('status', Revision::PENDIENTE)->oldest()->get()->map($map)->values(),
            'resolved' => Revision::with($with)->where('status', '!=', Revision::PENDIENTE)->latest('reviewed_at')->limit(20)->get()->map($map)->values(),
            'pending_reviews' => ArbolView::pendingReviews(),
        ]);
    }

    public function approve(Request $request, Revision $revision): RedirectResponse
    {
        if ($revision->status !== Revision::PENDIENTE) {
            return back()->with('error', 'Esa revisión ya fue respondida.');
        }

        DB::transaction(function () use ($request, $revision) {
            $revision->update([
                'status' => Revision::APROBADA,
                'reviewer_id' => $request->user()->id,
                'reviewed_at' => now(),
            ]);

            DB::table('habilidades_dominadas')->insertOrIgnore([
                'user_id' => $revision->user_id,
                'habilidad_id' => $revision->habilidad_id,
                'source' => 'revision',
                'granted_by' => $request->user()->id,
                'created_at' => now(),
            ]);
        });

        return back()->with('success', "Aprobada: {$revision->user->name} ya domina «{$revision->habilidad->name}».");
    }

    public function reject(Request $request, Revision $revision): RedirectResponse
    {
        $data = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ], [
            'comment.required' => 'Escribe qué le falta, para que sepa qué practicar.',
        ]);

        if ($revision->status !== Revision::PENDIENTE) {
            return back()->with('error', 'Esa revisión ya fue respondida.');
        }

        $revision->update([
            'status' => Revision::RECHAZADA,
            'comment' => trim($data['comment']),
            'reviewer_id' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', "Rechazada. {$revision->user->name} verá tu comentario y puede volver a pedirla.");
    }

    /** Entrenamientos completados del reto secreto de esa habilidad. */
    private function secretSessions(Revision $revision): int
    {
        return Entrenamiento::where('user_id', $revision->user_id)
            ->whereNotNull('completed_at')
            ->whereHas('reto', fn ($q) => $q->where('habilidad_id', $revision->habilidad_id)->where('kind', Reto::SECRETO))
            ->count();
    }
}
