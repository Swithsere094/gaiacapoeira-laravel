<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventoPrueba;
use App\Services\HostingerClient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Prueba de concepto (solo admin): crear un evento crea su subdominio
 * `{slug}.gaiacapoeira.com` con la API de Hostinger, en la misma petición
 * (sin cola). Eliminar borra el subdominio y el registro.
 */
class EventoPruebaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/eventos-prueba', [
            'eventos' => EventoPrueba::latest()->get()->map(fn (EventoPrueba $e) => [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'slug' => $e->slug,
                'estado' => $e->estado,
                'subdominio_url' => $e->subdominioUrl(),
                'respaldo_url' => '/eventos-prueba/'.$e->slug,
                'mensaje_api' => is_array($e->respuesta_api) ? ($e->respuesta_api['body']['message'] ?? null) : null,
                'created_at' => $e->created_at->toIso8601String(),
            ]),
            'dominio' => config('services.hostinger.domain'),
            'configurado' => HostingerClient::configurado(),
        ]);
    }

    public function store(Request $request, HostingerClient $hostinger): RedirectResponse
    {
        $request->validate(['nombre' => ['required', 'string', 'max:255']], [
            'nombre.required' => 'El nombre del evento es obligatorio',
            'nombre.max' => 'El nombre puede tener hasta 255 caracteres',
        ]);

        $nombre = trim((string) $request->input('nombre'));
        $slug = Str::slug($nombre);

        // Se valida el slug, pero el error va al campo del formulario.
        Validator::make(['nombre' => $slug], [
            'nombre' => [
                'required', 'regex:/^[a-z0-9-]+$/', 'min:3', 'max:63',
                Rule::notIn(EventoPrueba::RESERVADOS),
                Rule::unique('eventos_prueba', 'slug'),
            ],
        ], [
            'nombre.required' => 'El nombre debe tener letras o números',
            'nombre.regex' => "El subdominio «{$slug}» solo puede tener a-z, 0-9 y guiones",
            'nombre.min' => "El subdominio «{$slug}» es muy corto (mínimo 3 caracteres)",
            'nombre.max' => "El subdominio «{$slug}» es muy largo (máximo 63 caracteres)",
            'nombre.not_in' => "«{$slug}» es un subdominio reservado",
            'nombre.unique' => "Ya existe un evento con el subdominio «{$slug}»",
        ])->validate();

        $evento = EventoPrueba::create([
            'nombre' => $nombre,
            'slug' => $slug,
            'estado' => EventoPrueba::PENDIENTE,
        ]);

        $resultado = $hostinger->crearSubdominio($slug);

        $evento->update([
            'estado' => $resultado['ok'] ? EventoPrueba::CREADO : EventoPrueba::ERROR,
            'respuesta_api' => $resultado,
        ]);

        return $resultado['ok']
            ? back()->with('success', "Hostinger aceptó crear {$slug}.".config('services.hostinger.domain').'. El DNS y el certificado pueden tardar unos minutos.')
            : back()->with('error', 'Hostinger no creó el subdominio: '.$this->mensaje($resultado));
    }

    public function destroy(EventoPrueba $eventoPrueba, HostingerClient $hostinger): RedirectResponse
    {
        // Solo los creados tienen subdominio en Hostinger; los que quedaron
        // en error o pendiente se borran solo de la base.
        if ($eventoPrueba->estado === EventoPrueba::CREADO) {
            $resultado = $hostinger->eliminarSubdominio($eventoPrueba->slug);

            if (! $resultado['ok']) {
                $eventoPrueba->update(['respuesta_api' => $resultado]);

                return back()->with('error', 'Hostinger no eliminó el subdominio: '.$this->mensaje($resultado));
            }
        }

        $eventoPrueba->delete();

        return back()->with('success', "Evento «{$eventoPrueba->nombre}» eliminado");
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
