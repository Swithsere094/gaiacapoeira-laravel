<?php

namespace App\Support;

use App\Models\Entrenamiento;
use App\Models\Reto;
use App\Models\RetoSemana;
use Carbon\CarbonImmutable;

/**
 * Forma en que los retos viajan al navegador (tipos en
 * resources/js/lib/retos.ts).
 */
final class RetosView
{
    private const NO_MEDALS = ['oro' => 0, 'plata' => 0, 'bronce' => 0];

    /**
     * @param  array<string, array{oro: int, plata: int, bronce: int}>  $medals  de Progreso::medals()
     * @return array<string, mixed>
     */
    public static function reto(Reto $reto, array $medals = []): array
    {
        return [
            'id' => $reto->id,
            'kind' => $reto->kind,
            'category' => $reto->category,
            'title' => $reto->title,
            'description' => $reto->description,
            'minutes' => (int) round($reto->totalSeconds() / 60),
            'habilidad' => $reto->habilidad ? [
                'id' => $reto->habilidad->id,
                'name' => $reto->habilidad->name,
                'tree' => $reto->habilidad->tree,
            ] : null,
            'medals' => $medals[$reto->id] ?? self::NO_MEDALS,
        ];
    }

    /**
     * Semana en curso: en qué día va, qué días entrenó y la medalla que
     * tendría si terminara hoy.
     *
     * @param  array<string, array{oro: int, plata: int, bronce: int}>  $medals
     * @return array<string, mixed>
     */
    public static function activeWeek(RetoSemana $semana, CarbonImmutable $today, array $medals = []): array
    {
        $days = self::days($semana);

        return [
            'id' => $semana->id,
            'reto' => self::reto($semana->reto, $medals),
            'starts_on' => $semana->starts_on->toDateString(),
            'ends_on' => $semana->ends_on->toDateString(),
            'day' => (int) $semana->starts_on->diffInDays($today) + 1,
            'days_done' => $days,
            'trained_today' => in_array($today->toDateString(), $days, true),
            'medal_so_far' => RetoSemana::medalForDays(count($days)),
        ];
    }

    /** @return array<string, mixed> */
    public static function finishedWeek(RetoSemana $semana): array
    {
        $days = count(self::days($semana));

        return [
            'id' => $semana->id,
            'title' => $semana->reto->title,
            'habilidad' => $semana->reto->habilidad?->name,
            'ends_on' => $semana->ends_on->toDateString(),
            'days' => $days,
            'medal' => RetoSemana::medalForDays($days),
        ];
    }

    /** @return list<string> fechas Y-m-d con entrenamiento completado, ordenadas */
    private static function days(RetoSemana $semana): array
    {
        $days = $semana->entrenamientos
            ->map(fn (Entrenamiento $e) => $e->completed_on?->toDateString())
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->all();

        return array_values(array_filter($days, 'is_string'));
    }
}
