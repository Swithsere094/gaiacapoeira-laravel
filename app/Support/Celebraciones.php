<?php

namespace App\Support;

use App\Models\Habilidad;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\Revision;

/**
 * Logros que la persona todavía no vio celebrados, para mostrarle una
 * pantalla de celebración (tipos en resources/js/lib/celebraciones.ts):
 *
 *  - `medal`: una semana terminada con medalla. Si esa semana fue la que
 *    completó las semanas válidas de su habilidad, también revela el reto
 *    secreto (`secret`);
 *  - `approved`: una revisión aprobada, con lo que se desbloqueó.
 *
 * Al leerlos quedan marcados (`celebrated_at`): cada logro se celebra una sola
 * vez, en la primera página de retos (o el inicio) que la persona abra.
 * Las semanas terminadas sin medalla también se marcan, sin celebración.
 * Solo de las partes que la persona ve (App\Support\RetosAcceso): lo demás
 * queda sin marcar, para celebrarlo si algún día se le abre.
 */
final class Celebraciones
{
    /** @return list<array<string, mixed>> */
    public static function pull(Progreso $progreso): array
    {
        return [...self::medals($progreso), ...self::approvals($progreso)];
    }

    /** @return list<array<string, mixed>> */
    private static function medals(Progreso $progreso): array
    {
        $weeks = RetoSemana::with(['reto.habilidad', 'entrenamientos'])
            ->where('user_id', $progreso->user->id)
            ->whereNull('abandoned_at')
            ->whereNull('celebrated_at')
            ->where('ends_on', '<', $progreso->today->toDateString())
            ->whereHas('reto', fn ($q) => $q->whereIn('kind', RetosAcceso::kinds($progreso->user)))
            ->orderBy('ends_on')
            ->get();

        if ($weeks->isEmpty()) {
            return [];
        }

        RetoSemana::whereIn('id', $weeks->modelKeys())->update(['celebrated_at' => now()]);

        // Semanas válidas por habilidad antes de estas, para saber cuál de
        // ellas completó las que pide el reto secreto.
        $valid = [];
        foreach ($weeks as $week) {
            $h = $week->reto->habilidad;
            if ($h && $week->reto->kind === Reto::PRACTICA && $week->medal($progreso->today)) {
                $valid[$h->id] ??= $progreso->validWeeks($h->id);
                $valid[$h->id]--;
            }
        }

        $items = [];
        foreach ($weeks as $week) {
            $medal = $week->medal($progreso->today);
            if ($medal === null) {
                continue;
            }

            $h = $week->reto->habilidad;
            $secret = false;
            if ($h && $week->reto->kind === Reto::PRACTICA) {
                $valid[$h->id]++;
                $secret = $valid[$h->id] === $h->secret_weeks
                    && $progreso->isUnlocked($h->id)
                    && ! $progreso->isDominated($h->id);
            }

            $items[] = [
                'type' => 'medal',
                'medal' => $medal,
                'title' => $week->reto->title,
                'days' => $week->daysDone(),
                'category' => $week->reto->category,
                'habilidad' => $h ? self::skill($h) : null,
                'secret' => $secret,
            ];
        }

        return $items;
    }

    /** @return list<array<string, mixed>> */
    private static function approvals(Progreso $progreso): array
    {
        if (! RetosAcceso::arbol($progreso->user)) {
            return [];
        }

        $reviews = Revision::with('habilidad')
            ->where('user_id', $progreso->user->id)
            ->where('status', Revision::APROBADA)
            ->whereNull('celebrated_at')
            ->orderBy('reviewed_at')
            ->get();

        if ($reviews->isEmpty()) {
            return [];
        }

        Revision::whereIn('id', $reviews->modelKeys())->update(['celebrated_at' => now()]);

        return array_values($reviews->map(fn (Revision $r) => [
            'type' => 'approved',
            'habilidad' => self::skill($r->habilidad),
            // Lo que dependía de ella y ya quedó desbloqueado.
            'unlocks' => array_values($progreso->habilidades()
                ->filter(fn (Habilidad $h) => $h->requisitos->contains('id', $r->habilidad_id)
                    && $progreso->isUnlocked($h->id)
                    && ! $progreso->isDominated($h->id))
                ->map(fn (Habilidad $h) => self::skill($h))
                ->all()),
        ])->all());
    }

    /** @return array{id: string, name: string, icon: string|null, tree: string} */
    private static function skill(Habilidad $h): array
    {
        return ['id' => $h->id, 'name' => $h->name, 'icon' => $h->icon, 'tree' => $h->tree];
    }
}
