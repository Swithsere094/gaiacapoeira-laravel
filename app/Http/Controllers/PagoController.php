<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use App\Support\EventCalendar;
use App\Support\Uploads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Pagos de las inscripciones, del lado del organizador (permiso
 * `encuentros.gestionar`): registrar un pago (queda confirmado), confirmar
 * o rechazar los que reportó la persona, quitar uno registrado por error y
 * ver el comprobante (carpeta privada).
 */
class PagoController extends Controller
{
    public function store(Request $request, Encuentro $encuentro, Inscripcion $inscripcion): RedirectResponse
    {
        abort_unless($inscripcion->encuentro_id === $encuentro->id, 404);

        $data = $request->validate([
            'monto' => ['required', 'integer', 'min:1', 'max:100000000'],
            'fecha' => ['required', 'date'],
            'metodo' => ['nullable', Rule::in(InscripcionPago::METODOS)],
            'nota' => ['nullable', 'string', 'max:300'],
            'comprobante' => self::comprobanteRules(),
        ], self::mensajes());

        $inscripcion->pagos()->create([
            'monto' => $data['monto'],
            'fecha' => $data['fecha'],
            'metodo' => $data['metodo'] ?? null,
            'nota' => $data['nota'] ?? null,
            'comprobante_url' => $request->hasFile('comprobante')
                ? Uploads::store($request->file('comprobante'), InscripcionPago::COMPROBANTE_FOLDER)
                : null,
            'estado' => InscripcionPago::CONFIRMADO,
            'origen' => 'organizador',
            'user_id' => $request->user()?->getAuthIdentifier(),
        ]);
        $inscripcion->recalcularPago();

        return back()->with('success', "Pago registrado en {$inscripcion->codigo}.");
    }

    public function confirmar(Request $request, Encuentro $encuentro, InscripcionPago $pago): RedirectResponse
    {
        return $this->revisar($request, $encuentro, $pago, InscripcionPago::CONFIRMADO, 'Pago confirmado.');
    }

    public function rechazar(Request $request, Encuentro $encuentro, InscripcionPago $pago): RedirectResponse
    {
        return $this->revisar($request, $encuentro, $pago, InscripcionPago::RECHAZADO, 'Pago rechazado.');
    }

    /** Quitar un pago (registrado por error); borra también el comprobante. */
    public function destroy(Encuentro $encuentro, InscripcionPago $pago): RedirectResponse
    {
        $inscripcion = $this->inscripcionDe($encuentro, $pago);

        Uploads::delete($pago->comprobante_url);
        $pago->delete();
        $inscripcion->recalcularPago();

        return back()->with('success', 'Pago quitado.');
    }

    public function comprobante(Encuentro $encuentro, InscripcionPago $pago): BinaryFileResponse
    {
        $this->inscripcionDe($encuentro, $pago);
        $path = Uploads::pathFor($pago->comprobante_url);
        abort_if($path === null, 404);

        return response()->file($path, ['X-Content-Type-Options' => 'nosniff']);
    }

    /** @return list<string> */
    public static function comprobanteRules(bool $required = false): array
    {
        $ext = implode(',', InscripcionPago::COMPROBANTE_EXTENSIONS);

        return [$required ? 'required' : 'nullable', 'file', "extensions:{$ext}", "mimes:{$ext}", 'max:10240'];
    }

    /** @return array<string, string> */
    public static function mensajes(): array
    {
        return [
            'monto.required' => 'Escribe cuánto se pagó',
            'monto.integer' => 'El monto tiene que ser un número sin puntos ni comas',
            'monto.min' => 'El monto tiene que ser mayor que cero',
            'fecha.required' => 'Escribe la fecha del pago',
            'comprobante.required' => 'Adjunta el comprobante del pago',
            'comprobante.extensions' => 'El comprobante tiene que ser una imagen (JPG, PNG, WEBP) o un PDF',
            'comprobante.mimes' => 'El comprobante tiene que ser una imagen (JPG, PNG, WEBP) o un PDF',
            'comprobante.max' => 'El comprobante no puede superar 10 MB',
        ];
    }

    /** Hoy en Colombia (fecha por defecto de un pago). */
    public static function hoy(): string
    {
        return EventCalendar::today()->toDateString();
    }

    private function revisar(Request $request, Encuentro $encuentro, InscripcionPago $pago, string $estado, string $mensaje): RedirectResponse
    {
        $inscripcion = $this->inscripcionDe($encuentro, $pago);

        $pago->update(['estado' => $estado, 'user_id' => $request->user()?->getAuthIdentifier()]);
        $inscripcion->recalcularPago();

        return back()->with('success', $mensaje);
    }

    private function inscripcionDe(Encuentro $encuentro, InscripcionPago $pago): Inscripcion
    {
        $inscripcion = $pago->inscripcion;
        abort_unless($inscripcion->encuentro_id === $encuentro->id, 404);

        return $inscripcion;
    }
}
