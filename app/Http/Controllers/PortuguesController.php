<?php

namespace App\Http\Controllers;

use App\Models\PortuguesLote;
use App\Models\PortuguesPalabra;
use App\Models\PortuguesTarjeta;
use App\Models\Song;
use App\Models\User;
use App\Support\EventCalendar;
use App\Support\Repaso;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Portugués con asociaciones inverosímiles: las 1000 palabras más usadas en
 * lotes de 20, la asociación de cada persona y flashcards con repaso
 * espaciado (App\Support\Repaso). Para cualquier sesión; cada uno ve y toca
 * solo sus tarjetas. "Hoy" es la fecha de Colombia.
 */
class PortuguesController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $this->user($request);

        return Inertia::render('portugues', [
            // Lista fija: en las recargas parciales (al guardar) no se vuelve a mandar.
            'palabras' => fn () => $this->palabras(),
            'tarjetas' => fn () => $this->tarjetas($user),
            'lotesAvanzados' => fn () => PortuguesLote::where('user_id', $user->id)->orderBy('lote')->pluck('lote'),
            'hoy' => EventCalendar::today()->toDateString(),
            'loteTamano' => PortuguesPalabra::LOTE,
            'aprendidaDias' => Repaso::APRENDIDA,
        ]);
    }

    /** Guarda cómo suena, la asociación y la frase (vacío = sin asociación). */
    public function guardar(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $data = $request->validate([
            'suena_como' => ['nullable', 'string', 'max:150'],
            'asociacion' => ['nullable', 'string', 'max:1000'],
            'frase' => ['nullable', 'string', 'max:1000'],
        ]);
        $data = array_map(fn ($v) => filled($v) ? trim((string) $v) : null, $data + ['suena_como' => null, 'asociacion' => null, 'frase' => null]);

        $tarjeta = $this->tarjeta($request, $palabra);
        $tarjeta->fill($data);
        $tarjeta->saltada_at = null;

        if (! $tarjeta->exists && ! $tarjeta->tieneAsociacion() && $tarjeta->suena_como === null) {
            return back();
        }

        // Con asociación nueva, entra al repaso de hoy.
        if ($tarjeta->tieneAsociacion() && $tarjeta->proximo_repaso === null) {
            $tarjeta->proximo_repaso = EventCalendar::today();
        }

        $tarjeta->save();

        return back();
    }

    public function repasar(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $data = $request->validate(['nota' => ['required', Rule::in(Repaso::NOTAS)]]);

        $tarjeta = $this->tarjeta($request, $palabra);
        Repaso::calificar($tarjeta, $data['nota'], EventCalendar::today());
        $tarjeta->save();

        return back();
    }

    public function marcarAprendida(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $tarjeta = $this->tarjeta($request, $palabra);
        Repaso::marcarAprendida($tarjeta, EventCalendar::today());
        $tarjeta->saltada_at = null;
        $tarjeta->save();

        return back();
    }

    public function desmarcarAprendida(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $tarjeta = $this->tarjeta($request, $palabra);

        if ($tarjeta->exists) {
            Repaso::desmarcarAprendida($tarjeta, EventCalendar::today());
            $tarjeta->save();
        }

        return back();
    }

    /** Saltar la palabra al trabajar un lote: no se vuelve a proponer. */
    public function saltar(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $tarjeta = $this->tarjeta($request, $palabra);
        $tarjeta->saltada_at = now();
        $tarjeta->save();

        return back();
    }

    public function dejarDeSaltar(Request $request, PortuguesPalabra $palabra): RedirectResponse
    {
        $tarjeta = $this->tarjeta($request, $palabra);

        if ($tarjeta->exists) {
            $tarjeta->saltada_at = null;
            $tarjeta->save();
        }

        return back();
    }

    public function avanzarLote(Request $request, int $lote): RedirectResponse
    {
        $this->validarLote($lote);
        PortuguesLote::firstOrCreate(['user_id' => $this->user($request)->id, 'lote' => $lote]);

        return back();
    }

    public function deshacerLote(Request $request, int $lote): RedirectResponse
    {
        $this->validarLote($lote);
        PortuguesLote::where('user_id', $this->user($request)->id)->where('lote', $lote)->delete();

        return back();
    }

    private function user(Request $request): User
    {
        $user = $request->user();
        abort_unless($user instanceof User, 403);

        return $user;
    }

    private function tarjeta(Request $request, PortuguesPalabra $palabra): PortuguesTarjeta
    {
        return PortuguesTarjeta::firstOrNew(['user_id' => $this->user($request)->id, 'palabra_id' => $palabra->id]);
    }

    private function validarLote(int $lote): void
    {
        $max = PortuguesPalabra::loteDe((int) PortuguesPalabra::max('posicion'));
        abort_unless($lote >= 1 && $lote <= $max, 404);
    }

    /** @return array<int, array<string, mixed>> en orden de frecuencia */
    private function palabras(): array
    {
        $canciones = $this->formasDelCancionero();

        return PortuguesPalabra::orderBy('posicion')->get()
            ->map(function (PortuguesPalabra $p) use ($canciones) {
                $songs = [];
                foreach ($p->formas as $forma) {
                    foreach ($canciones[$forma] ?? [] as $songId => $_) {
                        $songs[$songId] = true;
                    }
                }

                return [
                    'id' => $p->id,
                    'posicion' => $p->posicion,
                    'palabra' => $p->palabra,
                    'traduccion' => $p->traduccion,
                    'tipo' => $p->tipo,
                    'formas' => $p->formas,
                    'ejemplo' => $p->ejemplo,
                    'ejemplo_traduccion' => $p->ejemplo_traduccion,
                    'canciones' => count($songs),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Palabras de las letras del cancionero "Sabiá cantou":
     * forma (en minúsculas) => [id de canción => true].
     *
     * @return array<string, array<string, true>>
     */
    private function formasDelCancionero(): array
    {
        $formas = [];

        foreach (Song::query()->get(['id', 'lyrics']) as $song) {
            $tokens = preg_split('/[^\p{L}]+/u', mb_strtolower($song->lyrics), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            foreach ($tokens as $token) {
                $formas[$token][$song->id] = true;
            }
        }

        return $formas;
    }

    /** @return array<string, array<string, mixed>> por id de palabra */
    private function tarjetas(User $user): array
    {
        return PortuguesTarjeta::where('user_id', $user->id)->get()
            ->mapWithKeys(fn (PortuguesTarjeta $t) => [$t->palabra_id => [
                'suena_como' => $t->suena_como,
                'asociacion' => $t->asociacion,
                'frase' => $t->frase,
                'intervalo' => $t->intervalo,
                'proximo_repaso' => $t->proximo_repaso?->toDateString(),
                'saltada' => $t->saltada_at !== null,
                'estado' => $t->estado(),
            ]])
            ->all();
    }
}
