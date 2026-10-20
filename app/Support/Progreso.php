<?php

namespace App\Support;

use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Reglas del demo de retos para una persona en un día dado ("hoy" en
 * Colombia, o el día que se simule en el demo):
 *
 *  - una habilidad se desbloquea cuando domina todos sus requisitos;
 *  - la frontera son las desbloqueadas que todavía no domina;
 *  - una semana vale si terminó, no se abandonó y tuvo 4 días o más;
 *  - el reto secreto de una habilidad aparece con `secret_weeks` semanas
 *    válidas en sus retos de práctica (o si ya la domina);
 *  - un reto semanal activo por habilidad, y uno por cada reto suelto.
 *
 * No hace falta ningún cron: todo se calcula al consultar.
 */
final class Progreso
{
    /** @var Collection<string, Habilidad> por id, con sus requisitos */
    private Collection $habilidades;

    /** @var array<string, true> ids de las habilidades dominadas */
    private array $dominadas;

    /** @var list<array{reto_id: string, habilidad_id: string|null, kind: string, days: int}>|null */
    private ?array $finishedWeeks = null;

    /** @var Collection<int, RetoSemana>|null */
    private ?Collection $activeWeeks = null;

    public function __construct(public readonly User $user, public readonly CarbonImmutable $today)
    {
        $this->habilidades = Habilidad::with('requisitos:id')->orderBy('tree')->orderBy('sort_order')->get()->keyBy('id');
        $this->dominadas = array_fill_keys(
            DB::table('habilidades_dominadas')->where('user_id', $user->id)->pluck('habilidad_id')->all(),
            true,
        );
    }

    public function isDominated(string $habilidadId): bool
    {
        return isset($this->dominadas[$habilidadId]);
    }

    public function isUnlocked(string $habilidadId): bool
    {
        $habilidad = $this->habilidades->get($habilidadId);

        return $habilidad !== null
            && $habilidad->requisitos->every(fn (Habilidad $r) => $this->isDominated($r->id));
    }

    /**
     * Habilidades que se pueden trabajar: desbloqueadas y sin dominar.
     *
     * @return list<string> ids, en el orden del árbol
     */
    public function frontier(): array
    {
        return array_values(array_filter(
            $this->habilidades->keys()->all(),
            fn (string $id) => $this->isUnlocked($id) && ! $this->isDominated($id),
        ));
    }

    /** @return Collection<string, Habilidad> todas, por id, con sus requisitos */
    public function habilidades(): Collection
    {
        return $this->habilidades;
    }

    /**
     * Nivel de cada habilidad en su árbol: 0 las raíces, y cada una un nivel
     * más abajo que su requisito más profundo.
     *
     * @return array<string, int> id => nivel
     */
    public function levels(): array
    {
        $levels = [];
        $level = function (string $id) use (&$level, &$levels): int {
            if (! isset($levels[$id])) {
                $deepest = -1;
                foreach ($this->habilidades[$id]->requisitos as $r) {
                    $deepest = max($deepest, $level($r->id));
                }
                $levels[$id] = $deepest + 1;
            }

            return $levels[$id];
        };

        foreach ($this->habilidades->keys() as $id) {
            $level($id);
        }

        return $levels;
    }

    /**
     * Requisitos directos e indirectos (todo lo que hay que dominar antes).
     *
     * @return list<string>
     */
    public function ancestorsOf(string $habilidadId): array
    {
        $found = [];
        $pending = [$habilidadId];

        while ($pending) {
            $id = array_pop($pending);
            foreach ($this->habilidades->get($id)->requisitos ?? [] as $r) {
                if (! isset($found[$r->id])) {
                    $found[$r->id] = true;
                    $pending[] = $r->id;
                }
            }
        }

        return array_keys($found);
    }

    /**
     * Habilidades que dependen (directa o indirectamente) de esta.
     *
     * @return list<string>
     */
    public function descendantsOf(string $habilidadId): array
    {
        return array_values(array_filter(
            $this->habilidades->keys()->all(),
            fn (string $id) => in_array($habilidadId, $this->ancestorsOf($id), true),
        ));
    }

    /** Null si puede pedir la revisión del reto secreto; si no, el motivo. */
    public function cannotRequestReview(string $habilidadId): ?string
    {
        if ($this->isDominated($habilidadId)) {
            return 'Ya dominas esta habilidad.';
        }

        if (! $this->secretUnlocked($habilidadId)) {
            return 'Todavía no has desbloqueado el reto secreto.';
        }

        $pending = DB::table('revisiones')->where('user_id', $this->user->id)
            ->where('habilidad_id', $habilidadId)->where('status', 'pendiente')->exists();

        if ($pending) {
            return 'Ya pediste la revisión: está pendiente.';
        }

        $trained = DB::table('entrenamientos as e')->join('retos as r', 'r.id', '=', 'e.reto_id')
            ->where('e.user_id', $this->user->id)->where('r.habilidad_id', $habilidadId)
            ->where('r.kind', Reto::SECRETO)->whereNotNull('e.completed_at')->exists();

        return $trained ? null : 'Completa el entrenamiento del reto secreto al menos una vez.';
    }

    /** Semanas válidas (con medalla) en los retos de práctica de la habilidad. */
    public function validWeeks(string $habilidadId): int
    {
        return count(array_filter(
            $this->finishedWeeks(),
            fn (array $w) => $w['habilidad_id'] === $habilidadId
                && $w['kind'] === Reto::PRACTICA
                && RetoSemana::medalForDays($w['days']) !== null,
        ));
    }

    /** Si ya apareció el reto secreto de la habilidad. */
    public function secretUnlocked(string $habilidadId): bool
    {
        if ($this->isDominated($habilidadId)) {
            return true;
        }

        $habilidad = $this->habilidades->get($habilidadId);

        return $habilidad !== null
            && $this->isUnlocked($habilidadId)
            && $this->validWeeks($habilidadId) >= $habilidad->secret_weeks;
    }

    /**
     * Medallas ganadas por reto.
     *
     * @return array<string, array{oro: int, plata: int, bronce: int}> reto_id => cantidad por medalla
     */
    public function medals(): array
    {
        $counts = [];

        foreach ($this->finishedWeeks() as $week) {
            $medal = RetoSemana::medalForDays($week['days']);
            if ($medal !== null) {
                $counts[$week['reto_id']][$medal] = ($counts[$week['reto_id']][$medal] ?? 0) + 1;
            }
        }

        return array_map(fn (array $c) => [
            'oro' => $c[RetoSemana::ORO] ?? 0,
            'plata' => $c[RetoSemana::PLATA] ?? 0,
            'bronce' => $c[RetoSemana::BRONCE] ?? 0,
        ], $counts);
    }

    /**
     * Semanas en curso (sin abandonar y sin terminar), con su reto y sus
     * entrenamientos.
     *
     * @return Collection<int, RetoSemana>
     */
    public function activeWeeks(): Collection
    {
        return $this->activeWeeks ??= RetoSemana::with(['reto.habilidad', 'entrenamientos'])
            ->where('user_id', $this->user->id)
            ->whereNull('abandoned_at')
            ->where('ends_on', '>=', $this->today->toDateString())
            ->orderBy('starts_on')
            ->get();
    }

    /** Null si puede empezar una semana de ese reto; si no, el motivo. */
    public function cannotStartWeek(Reto $reto): ?string
    {
        if (! $reto->isWeekly()) {
            return 'El reto secreto no se hace por semanas.';
        }

        $active = $this->activeWeeks();

        if ($reto->kind === Reto::SUELTO) {
            return $active->contains('reto_id', $reto->id) ? 'Ya tienes este reto en curso.' : null;
        }

        if ($reto->habilidad_id === null || ! $this->isUnlocked($reto->habilidad_id)) {
            return 'Todavía no has desbloqueado esta habilidad.';
        }

        $sameSkill = $active->contains(fn (RetoSemana $w) => $w->reto->kind === Reto::PRACTICA
            && $w->reto->habilidad_id === $reto->habilidad_id);

        return $sameSkill ? 'Ya tienes un reto en curso de esta habilidad.' : null;
    }

    /**
     * Semanas terminadas (sin abandonar) con sus días de entrenamiento.
     *
     * @return list<array{reto_id: string, habilidad_id: string|null, kind: string, days: int}>
     */
    private function finishedWeeks(): array
    {
        return $this->finishedWeeks ??= array_values(DB::table('reto_semanas as s')
            ->join('retos as r', 'r.id', '=', 's.reto_id')
            ->leftJoin('entrenamientos as e', function ($join) {
                $join->on('e.reto_semana_id', '=', 's.id')->whereNotNull('e.completed_on');
            })
            ->where('s.user_id', $this->user->id)
            ->whereNull('s.abandoned_at')
            ->where('s.ends_on', '<', $this->today->toDateString())
            ->groupBy('s.id', 's.reto_id', 'r.habilidad_id', 'r.kind')
            ->select('s.id', 's.reto_id', 'r.habilidad_id', 'r.kind', DB::raw('COUNT(DISTINCT e.completed_on) as days'))
            ->get()
            // La base devuelve el conteo como texto.
            ->map(fn (object $row) => [
                'reto_id' => $row->reto_id,
                'habilidad_id' => $row->habilidad_id,
                'kind' => $row->kind,
                'days' => (int) $row->days,
            ])
            ->all());
    }
}
