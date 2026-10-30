<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Inscripciones de un encuentro, del lado del organizador (permiso
 * `encuentros.gestionar`): notas y cancelar (los pagos van en
 * PagoController), asistencia el día del encuentro y exportar.
 */
class InscripcionController extends Controller
{
    public function update(Request $request, Encuentro $encuentro, Inscripcion $inscripcion): RedirectResponse
    {
        abort_unless($inscripcion->encuentro_id === $encuentro->id, 404);

        $data = $request->validate([
            'estado' => ['required', Rule::in([Inscripcion::ACTIVA, Inscripcion::CANCELADA])],
            'notas' => ['nullable', 'string', 'max:1000'],
        ]);

        $inscripcion->update([...$data, 'notas' => ($data['notas'] ?? null) ?: null]);

        return back()->with('success', "Inscripción {$inscripcion->codigo} actualizada.");
    }

    /** Lista para el día del encuentro (pensada para el celular). */
    public function asistencia(Encuentro $encuentro): Response
    {
        $inscripciones = $encuentro->inscripciones()
            ->where('estado', Inscripcion::ACTIVA)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('encuentros/asistencia', [
            'encuentro' => ['id' => $encuentro->id, 'nombre' => $encuentro->nombre],
            'inscripciones' => $inscripciones->map(fn (Inscripcion $i) => [
                'id' => $i->id,
                'codigo' => $i->codigo,
                'nombre' => $i->nombre,
                'apelido' => $i->apelido,
                'grupo' => $i->grupo,
                'precio_nombre' => $i->precio_nombre,
                'talla' => $i->talla,
                'saldo' => $i->saldo(),
                'asistio' => $i->asistio_at !== null,
            ])->values(),
        ]);
    }

    /** Marcar o desmarcar que la persona llegó. */
    public function toggleAsistencia(Encuentro $encuentro, Inscripcion $inscripcion): RedirectResponse
    {
        abort_unless($inscripcion->encuentro_id === $encuentro->id, 404);

        $inscripcion->update(['asistio_at' => $inscripcion->asistio_at ? null : now()]);

        return back();
    }

    /**
     * CSV para abrir en Excel: con BOM UTF-8 (tildes y ñ bien) y punto y
     * coma, el separador que espera Excel en español.
     */
    public function export(Encuentro $encuentro): StreamedResponse
    {
        $inscripciones = $encuentro->inscripciones()
            ->withCount(['pagos as por_revisar' => fn ($q) => $q->where('estado', InscripcionPago::REPORTADO)])
            ->oldest()
            ->get();
        $filename = $encuentro->slug.'-inscripciones-'.now('America/Bogota')->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($inscripciones) {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, [
                'Código', 'Fecha', 'Nombre', 'Apelido', 'Grupo', 'Profesor', 'Graduación',
                'Ciudad', 'Teléfono', 'Correo', 'Talla', 'Contacto de emergencia',
                'Teléfono de emergencia', 'Opción', 'Valor', 'Pago', 'Pagado', 'Saldo',
                'Pagos por revisar', 'Estado', 'Asistió', 'Notas',
            ], ';');

            foreach ($inscripciones as $i) {
                fputcsv($out, [
                    $i->codigo,
                    $i->created_at->setTimezone('America/Bogota')->format('Y-m-d H:i'),
                    $i->nombre, $i->apelido, $i->grupo, $i->profesor, $i->graduacion,
                    $i->ciudad, $i->telefono, $i->email, $i->talla,
                    $i->emergencia_nombre, $i->emergencia_telefono,
                    $i->precio_nombre, $i->precio_valor, $i->pago_estado,
                    $i->monto_pagado, $i->saldo(), $i->getAttribute('por_revisar'),
                    $i->estado, $i->asistio_at ? 'Sí' : 'No', $i->notas,
                ], ';');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
