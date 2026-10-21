<?php

namespace App\Http\Controllers;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Support\ArbolView;
use App\Support\Celebraciones;
use App\Support\Progreso;
use App\Support\RetosDemo;
use App\Support\RetosView;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Retos (demo, solo admins): aceptar retos semanales, hacer el
 * entrenamiento guiado y ver el progreso. Las reglas están en
 * App\Support\Progreso; "hoy" puede estar simulado (App\Support\RetosDemo).
 */
class RetoController extends Controller
{
    /** Tolerancia al comparar la duración del entrenamiento (segundos). */
    private const TOLERANCE = 3;

    /** Una sesión sin completar se puede retomar durante este tiempo extra. */
    private const RESUME_SECONDS = 2 * 3600;

    public function index(Request $request): Response
    {
        $today = RetosDemo::today($request);
        $progreso = RetosDemo::progreso($request);
        $medals = $progreso->medals();

        $frontier = Habilidad::with(['retos' => fn ($q) => $q->where('kind', Reto::PRACTICA)])
            ->whereIn('id', $progreso->frontier())
            ->orderBy('tree')->orderBy('sort_order')
            ->get()
            ->map(function (Habilidad $h) use ($progreso, $medals) {
                $reto = $h->retos->first();
                $reto?->setRelation('habilidad', $h);

                return [
                    'id' => $h->id,
                    'name' => $h->name,
                    'icon' => $h->icon,
                    'tree' => $h->tree,
                    'description' => $h->description,
                    'valid_weeks' => $progreso->validWeeks($h->id),
                    'secret_weeks' => $h->secret_weeks,
                    'secret_unlocked' => $progreso->secretUnlocked($h->id),
                    'reto' => $reto ? RetosView::reto($reto, $medals) : null,
                    'blocked' => $reto ? $progreso->cannotStartWeek($reto) : 'Sin reto de práctica.',
                ];
            });

        $sueltos = Reto::where('kind', Reto::SUELTO)->orderBy('sort_order')->get()
            ->map(fn (Reto $r) => [
                ...RetosView::reto($r, $medals),
                'blocked' => $progreso->cannotStartWeek($r),
            ]);

        $finished = RetoSemana::with(['reto.habilidad', 'entrenamientos'])
            ->where('user_id', $request->user()->id)
            ->whereNull('abandoned_at')
            ->where('ends_on', '<', $today->toDateString())
            ->orderByDesc('ends_on')
            ->limit(6)
            ->get();

        return Inertia::render('retos/index', [
            'active' => $progreso->activeWeeks()->map(fn (RetoSemana $s) => RetosView::activeWeek($s, $today, $medals))->values(),
            'frontier' => $frontier->values(),
            'sueltos' => $sueltos->values(),
            'finished' => $finished->map(fn (RetoSemana $s) => RetosView::finishedWeek($s))->values(),
            'pending_reviews' => ArbolView::pendingReviews(),
            'progress' => $progreso->treeProgress(),
            'celebrations' => Celebraciones::pull($progreso),
            'demo' => RetosDemo::toArray($request),
        ]);
    }

    /** Aceptar un reto semanal: empieza hoy y dura 7 días. */
    public function startWeek(Request $request, Reto $reto): RedirectResponse
    {
        $progreso = RetosDemo::progreso($request);

        if ($reason = $progreso->cannotStartWeek($reto)) {
            return back()->with('error', $reason);
        }

        RetoSemana::create([
            'user_id' => $request->user()->id,
            'reto_id' => $reto->id,
            'starts_on' => $progreso->today,
            'ends_on' => $progreso->today->addDays(RetoSemana::DAYS - 1),
        ]);

        return back()->with('success', "Aceptaste el reto «{$reto->title}». Tienes 7 días: entrena al menos 4 para ganar una medalla.");
    }

    public function abandon(Request $request, RetoSemana $semana): RedirectResponse
    {
        abort_unless($semana->user_id === $request->user()->id, 404);

        if (! $semana->isActive(RetosDemo::today($request))) {
            return back()->with('error', 'Esa semana ya terminó.');
        }

        $semana->update(['abandoned_at' => now()]);

        return back()->with('success', 'Abandonaste el reto. Esta semana no cuenta.');
    }

    /** Página del entrenamiento guiado (y la sesión en curso, si hay). */
    public function train(Request $request, Reto $reto): Response|RedirectResponse
    {
        $progreso = RetosDemo::progreso($request);
        $semana = $this->weekFor($progreso, $reto);

        if ($error = $this->cannotTrain($progreso, $reto, $semana)) {
            return redirect('/retos')->with('error', $error);
        }

        $reto->loadMissing('habilidad');
        $session = $this->sessionInProgress($request, $reto);

        return Inertia::render('retos/entrenar', [
            'reto' => [...RetosView::reto($reto, $progreso->medals()), 'steps' => $reto->steps],
            'semana' => $semana ? RetosView::activeWeek($semana, $progreso->today) : null,
            'session' => $session ? [
                'id' => $session->id,
                'started_at' => $session->started_at->toIso8601String(),
                'duration_seconds' => $session->duration_seconds,
            ] : null,
            'server_now' => now()->toIso8601String(),
            'demo' => RetosDemo::toArray($request),
        ]);
    }

    /** Iniciar el entrenamiento: el servidor anota la hora de inicio. */
    public function startSession(Request $request, Reto $reto): RedirectResponse
    {
        $progreso = RetosDemo::progreso($request);
        $semana = $this->weekFor($progreso, $reto);

        if ($error = $this->cannotTrain($progreso, $reto, $semana)) {
            return redirect('/retos')->with('error', $error);
        }

        if (! $this->sessionInProgress($request, $reto)) {
            $total = $reto->totalSeconds();

            Entrenamiento::create([
                'user_id' => $request->user()->id,
                'reto_id' => $reto->id,
                'reto_semana_id' => $semana?->id,
                'duration_seconds' => RetosDemo::fast($request) ? (int) ceil($total / RetosDemo::FAST_FACTOR) : $total,
                'started_at' => now(),
            ]);
        }

        return redirect("/retos/{$reto->id}/entrenar");
    }

    /** Completar: solo si pasó el tiempo del entrenamiento desde que empezó. */
    public function complete(Request $request, Entrenamiento $entrenamiento): RedirectResponse
    {
        abort_unless($entrenamiento->user_id === $request->user()->id, 404);

        if ($entrenamiento->completed_at !== null) {
            return redirect('/retos');
        }

        if ($entrenamiento->started_at->diffInSeconds(now()) < $entrenamiento->duration_seconds - self::TOLERANCE) {
            return back()->with('error', 'El entrenamiento todavía no termina.');
        }

        $today = RetosDemo::today($request);
        $semana = $entrenamiento->semana;

        if ($semana && ! $semana->isActive($today)) {
            return redirect('/retos')->with('error', 'La semana de este reto ya terminó: este entrenamiento no cuenta.');
        }

        // Si hoy ya había entrenado, este no suma otro día (se avisa).
        $alreadyCounted = $semana?->entrenamientos()->where('completed_on', $today->toDateString())->exists() ?? false;

        $entrenamiento->update(['completed_at' => now(), 'completed_on' => $today]);

        if (! $semana) {
            // Reto secreto: de vuelta a su habilidad en el árbol.
            $habilidad = $entrenamiento->reto->habilidad;

            return redirect("/retos/arbol?arbol={$habilidad?->tree}&habilidad={$habilidad?->id}")
                ->with('success', '¡Reto secreto completado! Cuando sientas que lo dominas, pide la revisión.');
        }

        return redirect('/retos')->with('success', $this->weekMessage($semana, $alreadyCounted));
    }

    private function weekFor(Progreso $progreso, Reto $reto): ?RetoSemana
    {
        return $reto->isWeekly()
            ? $progreso->activeWeeks()->first(fn (RetoSemana $s) => $s->reto_id === $reto->id)
            : null;
    }

    private function cannotTrain(Progreso $progreso, Reto $reto, ?RetoSemana $semana): ?string
    {
        if ($reto->isWeekly()) {
            return $semana ? null : 'Primero acepta el reto de la semana.';
        }

        return $reto->habilidad_id && $progreso->secretUnlocked($reto->habilidad_id)
            ? null
            : 'Todavía no has desbloqueado este reto secreto.';
    }

    private function sessionInProgress(Request $request, Reto $reto): ?Entrenamiento
    {
        $session = Entrenamiento::where('user_id', $request->user()->id)
            ->where('reto_id', $reto->id)
            ->whereNull('completed_at')
            ->latest('started_at')
            ->first();

        if (! $session || $session->started_at->addSeconds($session->duration_seconds + self::RESUME_SECONDS)->isPast()) {
            return null;
        }

        return $session;
    }

    /** "Llevas N de 7 días: vas en plata." */
    private function weekMessage(RetoSemana $semana, bool $alreadyCounted): string
    {
        $days = $semana->load('entrenamientos')->daysDone();
        $medal = RetoSemana::medalForDays($days);
        $next = $days < RetoSemana::MEDALS[RetoSemana::BRONCE] ? RetoSemana::MEDALS[RetoSemana::BRONCE] - $days : null;

        $status = match (true) {
            $medal !== null => "vas en {$medal}",
            default => $next === 1 ? 'te falta 1 día para el bronce' : "te faltan {$next} días para el bronce",
        };

        $today = $alreadyCounted ? ' Hoy ya contaba, así que no suma otro día.' : '';

        return "¡Entrenamiento completado!{$today} Llevas {$days} de 7 días: {$status}.";
    }
}
