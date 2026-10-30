<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\EncuentroActividad;
use App\Models\EncuentroInvitado;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use App\Support\ClientIp;
use App\Support\EventCalendar;
use App\Support\Uploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Lo público de un encuentro (sin sesión): la página con el formulario, la
 * inscripción, la confirmación / consulta con el enlace privado y la
 * portada. El encuentro y la base de las direcciones los deja
 * ResolveEncuentro en la petición.
 */
class EncuentroPublicoController extends Controller
{
    /** Inscripciones por IP del visitante en la ventana (anti-spam). */
    private const LIMIT = 10;

    private const WINDOW_SECONDS = 600;

    public function show(Request $request): Response
    {
        $encuentro = $this->encuentro($request);
        $encuentro->load('precios', 'actividades', 'invitados');
        $base = (string) $request->attributes->get('encuentro_base');

        return Inertia::render('encuentros/publico', [
            'encuentro' => [
                ...$this->present($encuentro, $request),
                'direccion' => $encuentro->direccion,
                'actividades' => $encuentro->actividades->map(fn (EncuentroActividad $a) => $a->toPublicArray())->values(),
                'invitados' => $encuentro->invitados->map(fn (EncuentroInvitado $i) => [
                    'id' => $i->id,
                    'nombre' => $i->nombre,
                    'titulo' => $i->titulo,
                    'grupo' => $i->grupo,
                    'ciudad' => $i->ciudad,
                    'bio' => $i->bio,
                    'foto' => $i->foto_url ? "{$base}/invitados/{$i->id}/foto" : null,
                ])->values(),
            ],
            'cierre' => $encuentro->motivoCierre(EventCalendar::today()),
            'tallas' => Inscripcion::TALLAS,
            'metodos' => InscripcionPago::METODOS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $encuentro = $this->encuentro($request);
        $base = (string) $request->attributes->get('encuentro_base');

        // Trampa para bots: el campo está oculto, una persona no lo llena.
        if (filled($request->input('sitio_web'))) {
            return redirect($base ?: '/');
        }

        $key = 'inscripcion:'.ClientIp::for($request);
        if (RateLimiter::tooManyAttempts($key, self::LIMIT)) {
            throw ValidationException::withMessages(['nombre' => 'Demasiadas inscripciones seguidas desde esta conexión. Intenta de nuevo en unos minutos.']);
        }

        if ($encuentro->motivoCierre(EventCalendar::today()) !== null) {
            throw ValidationException::withMessages(['nombre' => 'Las inscripciones de este encuentro no están abiertas.']);
        }

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'apelido' => ['nullable', 'string', 'max:60'],
            'grupo' => ['required', 'string', 'max:120'],
            'profesor' => ['nullable', 'string', 'max:120'],
            'graduacion' => ['nullable', 'string', 'max:60'],
            'ciudad' => ['required', 'string', 'max:80'],
            'telefono' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]{7,30}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'talla' => ['nullable', Rule::in(Inscripcion::TALLAS)],
            'emergencia_nombre' => ['required', 'string', 'max:120'],
            'emergencia_telefono' => ['required', 'string', 'max:30', 'regex:/^[0-9+()\s-]{7,30}$/'],
            'precio_id' => ['required', Rule::exists('encuentro_precios', 'id')->where('encuentro_id', $encuentro->id)],
            'consentimiento' => ['accepted'],
            // "Ya pagué": opcional; si lo marca, monto y comprobante son obligatorios.
            ...$this->pagoRules($request->boolean('ya_pague'), 'pago_'),
        ], [
            ...$this->pagoMensajes('pago_'),
            'nombre.required' => 'Escribe tu nombre completo',
            'grupo.required' => 'Escribe tu grupo',
            'ciudad.required' => 'Escribe tu ciudad',
            'telefono.required' => 'Escribe tu teléfono',
            'telefono.regex' => 'El teléfono solo puede tener números, espacios y el signo +',
            'email.email' => 'El correo no es válido',
            'emergencia_nombre.required' => 'Escribe un contacto de emergencia',
            'emergencia_telefono.required' => 'Escribe el teléfono del contacto de emergencia',
            'emergencia_telefono.regex' => 'El teléfono de emergencia solo puede tener números, espacios y el signo +',
            'precio_id.required' => 'Elige una opción de inscripción',
            'precio_id.exists' => 'Elige una opción de inscripción',
            'consentimiento.accepted' => 'Para inscribirte tienes que autorizar el tratamiento de tus datos',
        ]);

        RateLimiter::hit($key, self::WINDOW_SECONDS);

        $precio = $encuentro->precios()->whereKey($data['precio_id'])->firstOrFail();
        $inscripcion = $encuentro->inscripciones()->create([
            // Laravel ya recorta los textos y deja en null los vacíos.
            ...Arr::except($data, ['precio_id', 'consentimiento', 'pago_monto', 'pago_metodo', 'pago_comprobante', 'pago_nota']),
            'codigo' => Inscripcion::nuevoCodigo(),
            'token' => Inscripcion::nuevoToken(),
            'precio_id' => $precio->id,
            'precio_nombre' => $precio->nombre,
            'precio_valor' => $precio->valor,
            'consentimiento_at' => now(),
            'locale' => 'es',
        ]);

        if ($request->boolean('ya_pague')) {
            $this->reportar($request, $inscripcion, 'pago_');
        }

        return redirect("{$base}/inscripcion/{$inscripcion->token}");
    }

    /**
     * Reportar un pago después de inscribirse, desde el enlace privado
     * (queda por revisar hasta que un organizador lo confirma).
     */
    public function reportarPago(Request $request, string $token): RedirectResponse
    {
        $encuentro = $this->encuentro($request);
        $inscripcion = $encuentro->inscripciones()->where('token', $token)->firstOrFail();

        $key = 'inscripcion:'.ClientIp::for($request);
        if (RateLimiter::tooManyAttempts($key, self::LIMIT)) {
            throw ValidationException::withMessages(['monto' => 'Demasiados envíos seguidos desde esta conexión. Intenta de nuevo en unos minutos.']);
        }

        abort_if($inscripcion->estado !== Inscripcion::ACTIVA, 404);

        $request->validate($this->pagoRules(true), $this->pagoMensajes());
        RateLimiter::hit($key, self::WINDOW_SECONDS);
        $this->reportar($request, $inscripcion);

        return back()->with('success', 'Recibimos tu pago. Los organizadores lo van a revisar.');
    }

    /** Confirmación y consulta posterior, con el enlace privado. */
    public function consulta(Request $request, string $token): Response
    {
        $encuentro = $this->encuentro($request);
        $inscripcion = $encuentro->inscripciones()->where('token', $token)->firstOrFail();

        return Inertia::render('encuentros/inscripcion', [
            'encuentro' => $this->present($encuentro, $request),
            'inscripcion' => [
                'codigo' => $inscripcion->codigo,
                'nombre' => $inscripcion->nombre,
                'apelido' => $inscripcion->apelido,
                'grupo' => $inscripcion->grupo,
                'precio_nombre' => $inscripcion->precio_nombre,
                'precio_valor' => $inscripcion->precio_valor,
                'pago_estado' => $inscripcion->pago_estado,
                'monto_pagado' => $inscripcion->monto_pagado,
                'saldo' => $inscripcion->saldo(),
                'estado' => $inscripcion->estado,
                'created_at' => $inscripcion->created_at->toIso8601String(),
                // Sin comprobantes ni notas internas: solo lo que la persona necesita ver.
                'pagos' => $inscripcion->pagos->map(fn (InscripcionPago $p) => [
                    'id' => $p->id,
                    'monto' => $p->monto,
                    'fecha' => $p->fecha->toDateString(),
                    'metodo' => $p->metodo,
                    'estado' => $p->estado,
                ])->values(),
            ],
            'metodos' => InscripcionPago::METODOS,
        ]);
    }

    /**
     * Reglas de un pago reportado; `$prefijo` = 'pago_' en el formulario de
     * inscripción (junto a los otros campos).
     *
     * @return array<string, mixed>
     */
    private function pagoRules(bool $reporta, string $prefijo = ''): array
    {
        if (! $reporta) {
            return [];
        }

        return [
            "{$prefijo}monto" => ['required', 'integer', 'min:1', 'max:100000000'],
            "{$prefijo}metodo" => ['nullable', Rule::in(InscripcionPago::METODOS)],
            "{$prefijo}nota" => ['nullable', 'string', 'max:300'],
            "{$prefijo}comprobante" => PagoController::comprobanteRules(required: true),
        ];
    }

    /** @return array<string, string> */
    private function pagoMensajes(string $prefijo = ''): array
    {
        $mensajes = [];
        foreach (PagoController::mensajes() as $key => $text) {
            $mensajes[$prefijo.$key] = $text;
        }

        return $mensajes;
    }

    private function reportar(Request $request, Inscripcion $inscripcion, string $prefijo = ''): void
    {
        $file = $request->file("{$prefijo}comprobante");

        $inscripcion->pagos()->create([
            'monto' => (int) $request->input("{$prefijo}monto"),
            'fecha' => EventCalendar::today()->toDateString(),
            'metodo' => $request->input("{$prefijo}metodo") ?: null,
            'nota' => $request->input("{$prefijo}nota") ?: null,
            'comprobante_url' => $file instanceof UploadedFile
                ? Uploads::store($file, InscripcionPago::COMPROBANTE_FOLDER)
                : null,
            'estado' => InscripcionPago::REPORTADO,
            'origen' => 'participante',
        ]);
    }

    public function portada(Request $request): BinaryFileResponse
    {
        $path = Uploads::pathFor($this->encuentro($request)->portada_url);
        abort_if($path === null, 404);

        return response()->file($path);
    }

    /** Foto de un invitado (la carpeta de subidas es privada). */
    public function fotoInvitado(Request $request, string $invitado): BinaryFileResponse
    {
        $foto = $this->encuentro($request)->invitados()->whereKey($invitado)->value('foto_url');
        $path = Uploads::pathFor(is_string($foto) ? $foto : null);
        abort_if($path === null, 404);

        return response()->file($path);
    }

    private function encuentro(Request $request): Encuentro
    {
        $encuentro = $request->attributes->get('encuentro');
        abort_unless($encuentro instanceof Encuentro, 404);

        return $encuentro;
    }

    /** @return array<string, mixed> */
    private function present(Encuentro $encuentro, Request $request): array
    {
        $base = (string) $request->attributes->get('encuentro_base');

        return [
            'nombre' => $encuentro->nombre,
            'starts_on' => $encuentro->starts_on->toDateString(),
            'ends_on' => $encuentro->ends_on?->toDateString(),
            'lugar' => $encuentro->lugar,
            'mapa_url' => $encuentro->mapa_url,
            'descripcion' => $encuentro->descripcion,
            'info_pago' => $encuentro->info_pago,
            'portada' => $encuentro->portada_url ? $base.'/portada' : null,
            'inscripciones_hasta' => $encuentro->inscripciones_hasta?->toDateString(),
            'inscripciones_desde' => $encuentro->inscripciones_desde?->toDateString(),
            'estado' => $encuentro->estado,
            'base' => $base,
            'precios' => $encuentro->precios->map(fn ($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'descripcion' => $p->descripcion,
                'valor' => $p->valor,
            ])->values(),
        ];
    }
}
