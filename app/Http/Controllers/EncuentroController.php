<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use App\Services\HostingerClient;
use App\Support\EncuentroCalendario;
use App\Support\Uploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestión de encuentros (permiso `encuentros.gestionar`): crear y editar,
 * publicar (crea el subdominio la primera vez), cerrar o reabrir las
 * inscripciones y eliminar. Las inscripciones se gestionan en
 * InscripcionController; la página pública, en EncuentroPublicoController.
 */
class EncuentroController extends Controller
{
    public function index(): Response
    {
        $encuentros = Encuentro::withCount(['inscripciones' => fn ($q) => $q->where('estado', Inscripcion::ACTIVA)])
            ->orderByDesc('starts_on')
            ->get()
            ->map(fn (Encuentro $e) => [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'slug' => $e->slug,
                'starts_on' => $e->starts_on->toDateString(),
                'ends_on' => $e->ends_on?->toDateString(),
                'lugar' => $e->lugar,
                'estado' => $e->estado,
                'inscritos' => $e->inscripciones_count ?? 0,
                'cupo' => $e->cupo,
            ]);

        return Inertia::render('encuentros/index', ['encuentros' => $encuentros]);
    }

    public function create(): Response
    {
        return Inertia::render('encuentros/form', [
            'encuentro' => null,
            'dominio' => config('services.hostinger.domain'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request, null);

        $encuentro = DB::transaction(function () use ($request, $data) {
            $encuentro = Encuentro::create([
                ...$this->fields($data),
                'slug' => $data['slug'],
                'user_id' => $request->user()?->getAuthIdentifier(),
            ]);
            $this->savePortada($request, $encuentro);
            $this->syncPrecios($encuentro, $data['precios'] ?? []);

            return $encuentro;
        });

        return redirect("/encuentros/{$encuentro->id}")->with('success', 'Encuentro creado como borrador.');
    }

    public function show(Encuentro $encuentro): Response
    {
        $encuentro->load('precios');
        $inscripciones = $encuentro->inscripciones()->latest()->get();
        $activas = $inscripciones->where('estado', Inscripcion::ACTIVA);

        return Inertia::render('encuentros/show', [
            'encuentro' => $this->present($encuentro),
            'inscripciones' => $inscripciones->map(fn (Inscripcion $i) => [
                'id' => $i->id,
                'codigo' => $i->codigo,
                'nombre' => $i->nombre,
                'apelido' => $i->apelido,
                'grupo' => $i->grupo,
                'profesor' => $i->profesor,
                'graduacion' => $i->graduacion,
                'ciudad' => $i->ciudad,
                'telefono' => $i->telefono,
                'email' => $i->email,
                'talla' => $i->talla,
                'emergencia_nombre' => $i->emergencia_nombre,
                'emergencia_telefono' => $i->emergencia_telefono,
                'precio_nombre' => $i->precio_nombre,
                'precio_valor' => $i->precio_valor,
                'pago_estado' => $i->pago_estado,
                'monto_pagado' => $i->monto_pagado,
                'estado' => $i->estado,
                'notas' => $i->notas,
                'created_at' => $i->created_at->toIso8601String(),
            ])->values(),
            'resumen' => [
                'inscritos' => $activas->count(),
                'pagados' => $activas->where('pago_estado', 'pagado')->count(),
                'parciales' => $activas->where('pago_estado', 'parcial')->count(),
                'pendientes' => $activas->where('pago_estado', 'pendiente')->count(),
                'recaudado' => (int) $activas->sum('monto_pagado'),
                'esperado' => (int) $activas->sum('precio_valor'),
            ],
        ]);
    }

    public function edit(Encuentro $encuentro): Response
    {
        $encuentro->load('precios');

        return Inertia::render('encuentros/form', [
            'encuentro' => $this->present($encuentro),
            'dominio' => config('services.hostinger.domain'),
        ]);
    }

    public function update(Request $request, Encuentro $encuentro): RedirectResponse
    {
        $data = $this->validated($request, $encuentro);

        DB::transaction(function () use ($request, $encuentro, $data) {
            $encuentro->update([
                ...$this->fields($data),
                // El subdominio ya existe en Hostinger: el slug no cambia más.
                ...($encuentro->subdominio === 'ninguno' ? ['slug' => $data['slug']] : []),
            ]);
            $this->savePortada($request, $encuentro);
            $this->syncPrecios($encuentro, $data['precios'] ?? []);
        });

        EncuentroCalendario::sync($encuentro->fresh() ?? $encuentro);

        return redirect("/encuentros/{$encuentro->id}")->with('success', 'Cambios guardados.');
    }

    /** Publicar: la primera vez crea el subdominio en Hostinger. */
    public function publish(Encuentro $encuentro, HostingerClient $hostinger): RedirectResponse
    {
        if (! $encuentro->precios()->exists()) {
            return back()->with('error', 'Agrega al menos una opción de precio antes de publicar.');
        }

        if ($encuentro->subdominio !== 'creado') {
            $resultado = $hostinger->crearSubdominio($encuentro->slug);
            $encuentro->update([
                'subdominio' => $resultado['ok'] ? 'creado' : 'error',
                'respuesta_api' => $resultado,
            ]);

            if (! $resultado['ok']) {
                return back()->with('error', 'Hostinger no creó el subdominio: '.$this->mensaje($resultado).'. El encuentro sigue en borrador.');
            }
        }

        $encuentro->update(['estado' => Encuentro::PUBLICADO]);
        EncuentroCalendario::sync($encuentro);

        return back()->with('success', "Publicado en {$encuentro->url()}. Si es la primera vez, la dirección puede tardar unos minutos en funcionar.");
    }

    /** Vuelve a borrador: la página deja de verse (el subdominio queda). */
    public function unpublish(Encuentro $encuentro): RedirectResponse
    {
        $encuentro->update(['estado' => Encuentro::BORRADOR]);
        EncuentroCalendario::remove($encuentro);

        return back()->with('success', 'El encuentro volvió a borrador: la página ya no se ve.');
    }

    /** Cerrar o reabrir las inscripciones (la página sigue visible). */
    public function toggleInscripciones(Encuentro $encuentro): RedirectResponse
    {
        if (! in_array($encuentro->estado, [Encuentro::PUBLICADO, Encuentro::CERRADO], true)) {
            return back()->with('error', 'Solo un encuentro publicado puede cerrar o reabrir inscripciones.');
        }

        $cerrar = $encuentro->estado === Encuentro::PUBLICADO;
        $encuentro->update(['estado' => $cerrar ? Encuentro::CERRADO : Encuentro::PUBLICADO]);

        return back()->with('success', $cerrar ? 'Inscripciones cerradas.' : 'Inscripciones abiertas otra vez.');
    }

    /** Solo sin inscripciones; borra también el subdominio y la copia en el calendario. */
    public function destroy(Encuentro $encuentro, HostingerClient $hostinger): RedirectResponse
    {
        if ($encuentro->inscripciones()->exists()) {
            return back()->with('error', 'Este encuentro tiene inscripciones: no se puede eliminar.');
        }

        if ($encuentro->subdominio === 'creado') {
            $resultado = $hostinger->eliminarSubdominio($encuentro->slug);

            if (! $resultado['ok']) {
                return back()->with('error', 'Hostinger no eliminó el subdominio: '.$this->mensaje($resultado));
            }
        }

        EncuentroCalendario::remove($encuentro);
        Uploads::delete($encuentro->portada_url);
        $encuentro->delete();

        return redirect('/encuentros')->with('success', "Encuentro «{$encuentro->nombre}» eliminado.");
    }

    /**
     * @return array{nombre: string, slug: string, starts_on: string, ends_on?: string|null, lugar?: string|null, mapa_url?: string|null, descripcion?: string|null, info_pago?: string|null, cupo?: int|null, inscripciones_desde?: string|null, inscripciones_hasta?: string|null, precios?: list<array{id?: string|null, nombre: string, descripcion?: string|null, valor: int}>}
     */
    private function validated(Request $request, ?Encuentro $encuentro): array
    {
        $request->merge([
            'nombre' => trim((string) $request->input('nombre')),
            // Sin slug escrito, sale del nombre ("Batizado 2027" → batizado-2027).
            'slug' => Str::slug((string) ($request->input('slug') ?: $request->input('nombre'))),
        ]);

        $slugLocked = $encuentro !== null && $encuentro->subdominio !== 'ninguno';

        /** @var array{nombre: string, slug: string, starts_on: string, ends_on?: string|null, lugar?: string|null, mapa_url?: string|null, descripcion?: string|null, info_pago?: string|null, cupo?: int|null, inscripciones_desde?: string|null, inscripciones_hasta?: string|null, precios?: list<array{id?: string|null, nombre: string, descripcion?: string|null, valor: int}>} $data */
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'slug' => $slugLocked ? ['nullable'] : [
                'required', 'regex:/^[a-z0-9-]+$/', 'min:3', 'max:63',
                Rule::notIn(Encuentro::RESERVADOS),
                Rule::unique('encuentros', 'slug')->ignore($encuentro?->id),
            ],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'lugar' => ['nullable', 'string', 'max:200'],
            'mapa_url' => ['nullable', 'url:https', 'max:500'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'info_pago' => ['nullable', 'string', 'max:2000'],
            'cupo' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'inscripciones_desde' => ['nullable', 'date'],
            'inscripciones_hasta' => ['nullable', 'date', 'after_or_equal:inscripciones_desde'],
            'portada' => ['nullable', 'file', 'extensions:jpg,jpeg,png,webp', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'quitar_portada' => ['nullable', 'boolean'],
            'precios' => ['array', 'max:30'],
            'precios.*.id' => ['nullable', 'string'],
            'precios.*.nombre' => ['required', 'string', 'max:120'],
            'precios.*.descripcion' => ['nullable', 'string', 'max:200'],
            'precios.*.valor' => ['required', 'integer', 'min:0', 'max:100000000'],
        ], [
            'nombre.required' => 'El nombre del encuentro es obligatorio',
            'slug.required' => 'La dirección necesita letras o números',
            'slug.regex' => 'La dirección solo puede tener a-z, 0-9 y guiones',
            'slug.min' => 'La dirección es muy corta (mínimo 3 caracteres)',
            'slug.max' => 'La dirección es muy larga (máximo 63 caracteres)',
            'slug.not_in' => 'Esa dirección está reservada',
            'slug.unique' => 'Ya hay un encuentro con esa dirección',
            'starts_on.required' => 'La fecha de inicio es obligatoria',
            'ends_on.after_or_equal' => 'La fecha de fin no puede ser antes del inicio',
            'mapa_url.url' => 'El enlace del mapa tiene que empezar con https://',
            'cupo.min' => 'El cupo tiene que ser al menos 1',
            'inscripciones_hasta.after_or_equal' => 'El cierre de inscripciones no puede ser antes de la apertura',
            'portada.extensions' => 'La portada tiene que ser JPG, PNG o WEBP',
            'portada.mimes' => 'La portada tiene que ser JPG, PNG o WEBP',
            'portada.max' => 'La portada no puede superar 5 MB',
            'precios.*.nombre.required' => 'Cada opción de precio necesita un nombre',
            'precios.*.valor.required' => 'Cada opción de precio necesita un valor',
            'precios.*.valor.integer' => 'El valor tiene que ser un número sin puntos ni comas',
        ]);

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function fields(array $data): array
    {
        return [
            'nombre' => $data['nombre'],
            'starts_on' => $data['starts_on'],
            'ends_on' => ($data['ends_on'] ?? null) ?: null,
            'lugar' => ($data['lugar'] ?? null) ?: null,
            'mapa_url' => ($data['mapa_url'] ?? null) ?: null,
            'descripcion' => ($data['descripcion'] ?? null) ?: null,
            'info_pago' => ($data['info_pago'] ?? null) ?: null,
            'cupo' => $data['cupo'] ?? null,
            'inscripciones_desde' => ($data['inscripciones_desde'] ?? null) ?: null,
            'inscripciones_hasta' => ($data['inscripciones_hasta'] ?? null) ?: null,
        ];
    }

    private function savePortada(Request $request, Encuentro $encuentro): void
    {
        if ($request->hasFile('portada')) {
            Uploads::delete($encuentro->portada_url);
            $encuentro->update(['portada_url' => Uploads::store($request->file('portada'), 'encuentros')]);
        } elseif ($request->boolean('quitar_portada')) {
            Uploads::delete($encuentro->portada_url);
            $encuentro->update(['portada_url' => null]);
        }
    }

    /**
     * Las que llegan con id se actualizan, las nuevas se crean y las que ya
     * no están se borran (las inscripciones conservan la opción copiada).
     *
     * @param  list<array{id?: string|null, nombre: string, descripcion?: string|null, valor: int}>  $precios
     */
    private function syncPrecios(Encuentro $encuentro, array $precios): void
    {
        $keep = [];

        foreach ($precios as $i => $precio) {
            $values = [
                'nombre' => trim($precio['nombre']),
                'descripcion' => ($precio['descripcion'] ?? null) ?: null,
                'valor' => $precio['valor'],
                'sort_order' => $i,
            ];
            $existing = ($precio['id'] ?? null) ? $encuentro->precios()->whereKey($precio['id'])->first() : null;

            if ($existing) {
                $existing->update($values);
                $keep[] = $existing->id;
            } else {
                $keep[] = $encuentro->precios()->create($values)->id;
            }
        }

        $encuentro->precios()->whereNotIn('id', $keep)->delete();
    }

    /** @return array<string, mixed> */
    private function present(Encuentro $encuentro): array
    {
        return [
            'id' => $encuentro->id,
            'slug' => $encuentro->slug,
            'nombre' => $encuentro->nombre,
            'starts_on' => $encuentro->starts_on->toDateString(),
            'ends_on' => $encuentro->ends_on?->toDateString(),
            'lugar' => $encuentro->lugar,
            'mapa_url' => $encuentro->mapa_url,
            'descripcion' => $encuentro->descripcion,
            'info_pago' => $encuentro->info_pago,
            'portada_url' => $encuentro->portada_url,
            'cupo' => $encuentro->cupo,
            'inscripciones_desde' => $encuentro->inscripciones_desde?->toDateString(),
            'inscripciones_hasta' => $encuentro->inscripciones_hasta?->toDateString(),
            'estado' => $encuentro->estado,
            'subdominio' => $encuentro->subdominio,
            'url' => $encuentro->url(),
            'respaldo_url' => '/e/'.$encuentro->slug,
            'precios' => $encuentro->precios->map(fn ($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion,
                'valor' => $p->valor,
            ])->values(),
        ];
    }

    /** @param array{ok: bool, status: int|null, body: mixed} $resultado */
    private function mensaje(array $resultado): string
    {
        $body = $resultado['body'];
        $message = is_array($body) ? ($body['message'] ?? null) : null;

        return is_string($message) && $message !== ''
            ? $message
            : 'respuesta '.($resultado['status'] ?? 'sin código');
    }
}
