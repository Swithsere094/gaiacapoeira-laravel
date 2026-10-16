<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Support\EventCalendar;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Eventos del calendario (/eventos, vista de mes o de semana). Quién puede
 * qué: App\Policies\EventoPolicy.
 */
class EventoController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('eventos', [
            'calendar' => EventCalendar::build(
                (string) $request->query('vista', 'mes'),
                $request->string('fecha')->toString() ?: null,
                $request->user(),
            ),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('create', Evento::class);

        Evento::create([...$this->validated($request), 'user_id' => $request->user()->id]);

        return back();
    }

    public function update(Request $request, Evento $evento): RedirectResponse
    {
        Gate::authorize('update', $evento);

        $evento->update($this->validated($request));

        return back();
    }

    public function destroy(Evento $evento): RedirectResponse
    {
        Gate::authorize('delete', $evento);

        $evento->delete();

        return back();
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'ends_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_on', 'required_with:repeat_days'],
            'start_time' => ['nullable', 'date_format:H:i', 'required_with:end_time'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'repeat_days' => ['nullable', 'array'],
            'repeat_days.*' => ['integer', 'between:1,7', 'distinct'],
        ], [
            'title.required' => 'El título es obligatorio',
            'starts_on.required' => 'La fecha de inicio es obligatoria',
            'starts_on.date_format' => 'La fecha de inicio no es válida',
            'ends_on.date_format' => 'La fecha de fin no es válida',
            'ends_on.after_or_equal' => 'La fecha de fin no puede ser anterior a la de inicio',
            'ends_on.required_with' => 'Un evento que se repite necesita fecha de fin',
            'start_time.required_with' => 'Falta la hora de inicio',
            'start_time.date_format' => 'La hora de inicio no es válida',
            'end_time.date_format' => 'La hora de fin no es válida',
            'end_time.after' => 'La hora de fin tiene que ser posterior a la de inicio',
            'repeat_days.*' => 'Día de la semana inválido',
        ]);

        $repeat = array_values(array_unique(array_map('intval', $data['repeat_days'] ?? [])));
        sort($repeat);

        $start = CarbonImmutable::parse($data['starts_on']);
        $end = ! empty($data['ends_on']) ? CarbonImmutable::parse($data['ends_on']) : null;

        // Un evento de un solo día no necesita fecha de fin.
        if ($end && $end->equalTo($start) && $repeat === []) {
            $end = null;
        }

        // Los eventos recurrentes o de varios días duran como máximo un año.
        if ($end && $end->gt($start->addYear())) {
            throw ValidationException::withMessages(['ends_on' => 'El evento puede durar como máximo un año']);
        }

        $data['ends_on'] = $end?->toDateString();
        $data['repeat_days'] = $repeat ?: null;
        $data['description'] = ($data['description'] ?? null) ?: null;
        $data['location'] = ($data['location'] ?? null) ?: null;
        $data['start_time'] = ($data['start_time'] ?? null) ?: null;
        $data['end_time'] = $data['start_time'] ? (($data['end_time'] ?? null) ?: null) : null;

        if ($repeat !== [] && (new Evento($data))->occurrencesBetween($start, $end ?? $start) === []) {
            throw ValidationException::withMessages(['repeat_days' => 'Ninguno de los días elegidos cae entre las dos fechas']);
        }

        return $data;
    }
}
