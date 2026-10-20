<?php

namespace App\Support;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\Revision;
use Illuminate\Support\Facades\DB;

/**
 * Las habilidades de un árbol tal como las ve una persona (tipos en
 * resources/js/lib/arbol.ts): estado, requisitos, retos, avance hacia el
 * secreto, última revisión y cómo la dominó.
 *
 * El reto secreto solo viaja (título incluido) si ya está desbloqueado.
 */
final class ArbolView
{
    public const DOMINADA = 'dominada';

    public const DISPONIBLE = 'disponible';

    public const BLOQUEADA = 'bloqueada';

    /** @return list<array<string, mixed>> */
    public static function nodes(Progreso $progreso, string $tree): array
    {
        $userId = $progreso->user->id;
        $levels = $progreso->levels();
        $medals = $progreso->medals();
        $skills = $progreso->habilidades()->filter(fn (Habilidad $h) => $h->tree === $tree);
        $ids = $skills->keys()->all();

        $retos = Reto::whereIn('habilidad_id', $ids)->orderBy('sort_order')->get()->groupBy('habilidad_id');

        $inProgress = $progreso->activeWeeks()
            ->filter(fn (RetoSemana $w) => $w->reto->kind === Reto::PRACTICA)
            ->mapWithKeys(fn (RetoSemana $w) => [(string) $w->reto->habilidad_id => true]);

        $reviews = Revision::with('reviewer:id,name')
            ->where('user_id', $userId)
            ->whereIn('habilidad_id', $ids)
            ->orderByDesc('created_at')
            ->get()
            ->unique('habilidad_id')
            ->keyBy('habilidad_id');

        $sessions = Entrenamiento::where('user_id', $userId)
            ->whereNotNull('completed_at')
            ->whereIn('reto_id', $retos->flatten()->where('kind', Reto::SECRETO)->pluck('id'))
            ->selectRaw('reto_id, COUNT(*) as total')
            ->groupBy('reto_id')
            ->pluck('total', 'reto_id');

        $dominated = DB::table('habilidades_dominadas as d')
            ->leftJoin('usuarios as u', 'u.id', '=', 'd.granted_by')
            ->where('d.user_id', $userId)
            ->whereIn('d.habilidad_id', $ids)
            ->get(['d.habilidad_id', 'd.source', 'd.created_at', 'u.name'])
            ->keyBy('habilidad_id');

        return array_values($skills->map(function (Habilidad $h) use ($progreso, $levels, $medals, $retos, $inProgress, $reviews, $sessions, $dominated) {
            $own = $retos->get($h->id, collect());
            $practica = $own->firstWhere('kind', Reto::PRACTICA);
            $secreto = $own->firstWhere('kind', Reto::SECRETO);
            $practica?->setRelation('habilidad', $h);
            $isDominated = $progreso->isDominated($h->id);
            $secretUnlocked = $progreso->secretUnlocked($h->id);
            $review = $reviews->get($h->id);
            $domination = $dominated->get($h->id);

            return [
                'id' => $h->id,
                'name' => $h->name,
                'description' => $h->description,
                'video_url' => $h->video_url,
                'level' => $levels[$h->id] ?? 0,
                'requisitos' => $h->requisitos->pluck('id')->values()->all(),
                'status' => match (true) {
                    $isDominated => self::DOMINADA,
                    $progreso->isUnlocked($h->id) => self::DISPONIBLE,
                    default => self::BLOQUEADA,
                },
                'in_progress' => $inProgress->has($h->id),
                'valid_weeks' => $progreso->validWeeks($h->id),
                'secret_weeks' => $h->secret_weeks,
                'practica' => $practica ? [
                    ...RetosView::reto($practica, $medals),
                    'blocked' => $progreso->cannotStartWeek($practica),
                ] : null,
                'secreto' => $secretUnlocked && $secreto ? [
                    'id' => $secreto->id,
                    'title' => $secreto->title,
                    'description' => $secreto->description,
                    'minutes' => (int) round($secreto->totalSeconds() / 60),
                    'sessions' => (int) ($sessions[$secreto->id] ?? 0),
                ] : null,
                'review' => $review ? [
                    'status' => $review->status,
                    'comment' => $review->comment,
                    'requested_on' => $review->created_at->toDateString(),
                    'reviewer' => $review->reviewer?->name,
                ] : null,
                // Solo se calcula si tiene sentido (consulta la base).
                'review_blocked' => $secretUnlocked && ! $isDominated
                    ? $progreso->cannotRequestReview($h->id)
                    : null,
                'dominated' => $domination ? [
                    'source' => $domination->source,
                    'by' => $domination->name,
                    'on' => substr((string) $domination->created_at, 0, 10),
                ] : null,
            ];
        })->all());
    }

    /** Cuántas revisiones esperan respuesta (para la pestaña "Revisiones"). */
    public static function pendingReviews(): int
    {
        return Revision::where('status', Revision::PENDIENTE)->count();
    }
}
