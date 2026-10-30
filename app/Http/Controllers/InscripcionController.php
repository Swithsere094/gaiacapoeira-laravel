<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\Inscripcion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Inscripciones de un encuentro, del lado del organizador (permiso
 * `encuentros.gestionar`): marcar el pago a mano (pendiente, parcial o
 * pagado, con el monto), notas, cancelar y exportar.
 */
class InscripcionController extends Controller
{
    public function update(Request $request, Encuentro $encuentro, Inscripcion $inscripcion): RedirectResponse
    {
        abort_unless($inscripcion->encuentro_id === $encuentro->id, 404);

        $data = $request->validate([
            'pago_estado' => ['required', Rule::in(Inscripcion::PAGO_ESTADOS)],
            'monto_pagado' => ['required', 'integer', 'min:0', 'max:100000000'],
            'estado' => ['required', Rule::in([Inscripcion::ACTIVA, Inscripcion::CANCELADA])],
            'notas' => ['nullable', 'string', 'max:1000'],
        ], [
            'monto_pagado.integer' => 'El monto tiene que ser un número sin puntos ni comas',
            'monto_pagado.min' => 'El monto no puede ser negativo',
        ]);

        $inscripcion->update([...$data, 'notas' => ($data['notas'] ?? null) ?: null]);

        return back()->with('success', "Inscripción {$inscripcion->codigo} actualizada.");
    }

    /**
     * CSV para abrir en Excel: con BOM UTF-8 (tildes y ñ bien) y punto y
     * coma, el separador que espera Excel en español.
     */
    public function export(Encuentro $encuentro): StreamedResponse
    {
        $inscripciones = $encuentro->inscripciones()->oldest()->get();
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
                'Estado', 'Notas',
            ], ';');

            foreach ($inscripciones as $i) {
                fputcsv($out, [
                    $i->codigo,
                    $i->created_at->setTimezone('America/Bogota')->format('Y-m-d H:i'),
                    $i->nombre, $i->apelido, $i->grupo, $i->profesor, $i->graduacion,
                    $i->ciudad, $i->telefono, $i->email, $i->talla,
                    $i->emergencia_nombre, $i->emergencia_telefono,
                    $i->precio_nombre, $i->precio_valor, $i->pago_estado,
                    $i->monto_pagado, $i->saldo(), $i->estado, $i->notas,
                ], ';');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
