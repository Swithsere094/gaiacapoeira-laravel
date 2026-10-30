<?php

namespace App\Http\Controllers;

use App\Models\Encuentro;
use App\Models\EncuentroMovimiento;
use App\Models\Inscripcion;
use App\Models\InscripcionPago;
use App\Support\EventCalendar;
use App\Support\Uploads;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Contabilidad de un encuentro (permiso `encuentros.gestionar`): los pagos
 * confirmados de las inscripciones se suman solos como ingresos; el
 * organizador anota los gastos y otros ingresos (EncuentroMovimiento), con
 * comprobante opcional.
 *
 * Los pagos confirmados cuentan aunque la inscripción se haya cancelado (la
 * plata entró); si se devuelve, se anota como gasto "Devoluciones".
 */
class ContabilidadController extends Controller
{
    public function index(Encuentro $encuentro): Response
    {
        $movimientos = $encuentro->movimientos()->with('usuario')->get();
        $pagos = $this->pagosConfirmados($encuentro);
        $activas = $encuentro->inscripciones()->where('estado', Inscripcion::ACTIVA)->with('pagos')->get();

        $deInscripciones = (int) $pagos->sum('monto');
        $otrosIngresos = (int) $movimientos->where('tipo', EncuentroMovimiento::INGRESO)->sum('monto');
        $gastos = (int) $movimientos->where('tipo', EncuentroMovimiento::GASTO)->sum('monto');

        return Inertia::render('encuentros/contabilidad', [
            'encuentro' => [
                'id' => $encuentro->id,
                'nombre' => $encuentro->nombre,
                'starts_on' => $encuentro->starts_on->toDateString(),
                'ends_on' => $encuentro->ends_on?->toDateString(),
            ],
            'movimientos' => $movimientos->map(fn (EncuentroMovimiento $m) => [
                'id' => $m->id,
                'tipo' => $m->tipo,
                'fecha' => $m->fecha->toDateString(),
                'concepto' => $m->concepto,
                'categoria' => $m->categoria,
                'monto' => $m->monto,
                'metodo' => $m->metodo,
                'nota' => $m->nota,
                'comprobante' => $m->comprobante_url ? "/encuentros/{$encuentro->id}/movimientos/{$m->id}/comprobante" : null,
                'anotado_por' => $m->usuario?->name ?: $m->usuario?->username,
            ])->values(),
            'resumen' => [
                'inscripciones' => $deInscripciones,
                'pagos_count' => $pagos->count(),
                'otros_ingresos' => $otrosIngresos,
                'gastos' => $gastos,
                'balance' => $deInscripciones + $otrosIngresos - $gastos,
                // Lo que falta cobrar a las inscripciones activas.
                'por_cobrar' => (int) $activas->sum(fn (Inscripcion $i) => $i->saldo()),
                // Reportado por las personas y todavía sin confirmar (no suma).
                'por_revisar' => (int) $activas->sum(fn (Inscripcion $i) => $i->pagos->where('estado', InscripcionPago::REPORTADO)->sum('monto')),
                'gastos_por_categoria' => $movimientos->where('tipo', EncuentroMovimiento::GASTO)
                    ->groupBy('categoria')
                    ->map(fn (Collection $grupo, string $categoria) => ['categoria' => $categoria, 'total' => (int) $grupo->sum('monto')])
                    ->sortByDesc('total')
                    ->values(),
                'por_metodo' => $this->porMetodo($pagos, $movimientos),
            ],
            'categorias' => [
                'gasto' => EncuentroMovimiento::CATEGORIAS_GASTO,
                'ingreso' => EncuentroMovimiento::CATEGORIAS_INGRESO,
            ],
            'metodos' => InscripcionPago::METODOS,
            'hoy' => EventCalendar::today()->toDateString(),
        ]);
    }

    public function store(Request $request, Encuentro $encuentro): RedirectResponse
    {
        $data = $this->validated($request);

        $encuentro->movimientos()->create([
            ...$data,
            'comprobante_url' => $request->hasFile('comprobante')
                ? Uploads::store($request->file('comprobante'), InscripcionPago::COMPROBANTE_FOLDER)
                : null,
            'user_id' => $request->user()?->getAuthIdentifier(),
        ]);

        return back()->with('success', $data['tipo'] === EncuentroMovimiento::GASTO ? 'Gasto anotado.' : 'Ingreso anotado.');
    }

    public function update(Request $request, Encuentro $encuentro, string $movimiento): RedirectResponse
    {
        $registro = $this->movimiento($encuentro, $movimiento);
        $data = $this->validated($request);

        if ($request->hasFile('comprobante')) {
            Uploads::delete($registro->comprobante_url);
            $data['comprobante_url'] = Uploads::store($request->file('comprobante'), InscripcionPago::COMPROBANTE_FOLDER);
        } elseif ($request->boolean('quitar_comprobante')) {
            Uploads::delete($registro->comprobante_url);
            $data['comprobante_url'] = null;
        }

        $registro->update($data);

        return back()->with('success', 'Cambios guardados.');
    }

    public function destroy(Encuentro $encuentro, string $movimiento): RedirectResponse
    {
        $registro = $this->movimiento($encuentro, $movimiento);
        Uploads::delete($registro->comprobante_url);
        $registro->delete();

        return back()->with('success', 'Movimiento eliminado.');
    }

    public function comprobante(Encuentro $encuentro, string $movimiento): BinaryFileResponse
    {
        $path = Uploads::pathFor($this->movimiento($encuentro, $movimiento)->comprobante_url);
        abort_if($path === null, 404);

        return response()->file($path, ['X-Content-Type-Options' => 'nosniff']);
    }

    /**
     * Libro del encuentro para Excel (BOM UTF-8 y punto y coma): pagos
     * confirmados de las inscripciones y movimientos anotados, por fecha,
     * con los totales al final.
     */
    public function export(Encuentro $encuentro): StreamedResponse
    {
        $filas = [];
        foreach ($this->pagosConfirmados($encuentro) as $pago) {
            $filas[] = [
                $pago->fecha->toDateString(), 'Ingreso', 'Inscripciones',
                "Inscripción {$pago->inscripcion->codigo} · {$pago->inscripcion->nombre}",
                $pago->metodo, $pago->monto, '', $pago->nota, $pago->comprobante_url ? 'Sí' : 'No',
            ];
        }
        foreach ($encuentro->movimientos as $m) {
            $ingreso = $m->tipo === EncuentroMovimiento::INGRESO;
            $filas[] = [
                $m->fecha->toDateString(), $ingreso ? 'Ingreso' : 'Gasto', $m->categoria, $m->concepto,
                $m->metodo, $ingreso ? $m->monto : '', $ingreso ? '' : $m->monto, $m->nota, $m->comprobante_url ? 'Sí' : 'No',
            ];
        }
        usort($filas, fn ($a, $b) => strcmp((string) $a[0], (string) $b[0]));

        $ingresos = array_sum(array_map(fn ($f) => (int) $f[5], $filas));
        $gastos = array_sum(array_map(fn ($f) => (int) $f[6], $filas));
        $filename = $encuentro->slug.'-contabilidad-'.now('America/Bogota')->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($filas, $ingresos, $gastos) {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Método', 'Ingreso', 'Gasto', 'Nota', 'Comprobante'], ';');
            foreach ($filas as $fila) {
                fputcsv($out, $fila, ';');
            }
            fputcsv($out, [], ';');
            fputcsv($out, ['', '', '', 'Totales', '', $ingresos, $gastos, '', ''], ';');
            fputcsv($out, ['', '', '', 'Balance', '', $ingresos - $gastos, '', '', ''], ';');
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @return Collection<int, InscripcionPago> */
    private function pagosConfirmados(Encuentro $encuentro): Collection
    {
        return InscripcionPago::query()
            ->where('estado', InscripcionPago::CONFIRMADO)
            ->whereIn('inscripcion_id', $encuentro->inscripciones()->select('id'))
            ->with('inscripcion')
            ->orderBy('fecha')
            ->get();
    }

    /**
     * Ingresos, gastos y neto por método de pago (para cuadrar Nequi,
     * efectivo…). Sin método = "Sin indicar".
     *
     * @param  Collection<int, InscripcionPago>  $pagos
     * @param  Collection<int, EncuentroMovimiento>  $movimientos
     * @return list<array{metodo: string, ingresos: int, gastos: int, neto: int}>
     */
    private function porMetodo(Collection $pagos, Collection $movimientos): array
    {
        $totales = [];
        $sumar = function (?string $metodo, int $ingreso, int $gasto) use (&$totales) {
            $clave = $metodo ?: 'Sin indicar';
            $totales[$clave] ??= ['metodo' => $clave, 'ingresos' => 0, 'gastos' => 0, 'neto' => 0];
            $totales[$clave]['ingresos'] += $ingreso;
            $totales[$clave]['gastos'] += $gasto;
            $totales[$clave]['neto'] += $ingreso - $gasto;
        };

        foreach ($pagos as $p) {
            $sumar($p->metodo, $p->monto, 0);
        }
        foreach ($movimientos as $m) {
            $ingreso = $m->tipo === EncuentroMovimiento::INGRESO;
            $sumar($m->metodo, $ingreso ? $m->monto : 0, $ingreso ? 0 : $m->monto);
        }

        return array_values($totales);
    }

    private function movimiento(Encuentro $encuentro, string $id): EncuentroMovimiento
    {
        return $encuentro->movimientos()->whereKey($id)->firstOrFail();
    }

    /** @return array{tipo: string, fecha: string, concepto: string, categoria: string, monto: int, metodo: string|null, nota: string|null} */
    private function validated(Request $request): array
    {
        $tipo = $request->input('tipo');
        $categorias = $tipo === EncuentroMovimiento::GASTO ? EncuentroMovimiento::CATEGORIAS_GASTO : EncuentroMovimiento::CATEGORIAS_INGRESO;

        /** @var array{tipo: string, fecha: string, concepto: string, categoria: string, monto: int, metodo?: string|null, nota?: string|null} $data */
        $data = $request->validate([
            'tipo' => ['required', Rule::in([EncuentroMovimiento::INGRESO, EncuentroMovimiento::GASTO])],
            'fecha' => ['required', 'date'],
            'concepto' => ['required', 'string', 'max:150'],
            'categoria' => ['required', Rule::in($categorias)],
            'monto' => ['required', 'integer', 'min:1', 'max:1000000000'],
            'metodo' => ['nullable', Rule::in(InscripcionPago::METODOS)],
            'nota' => ['nullable', 'string', 'max:300'],
            'comprobante' => PagoController::comprobanteRules(),
            'quitar_comprobante' => ['nullable', 'boolean'],
        ], [
            'fecha.required' => 'Escribe la fecha',
            'concepto.required' => 'Escribe el concepto (qué se pagó o de dónde vino la plata)',
            'categoria.required' => 'Elige una categoría',
            'categoria.in' => 'Elige una categoría de la lista',
            'monto.required' => 'Escribe el monto',
            'monto.integer' => 'El monto tiene que ser un número sin puntos ni comas',
            'monto.min' => 'El monto tiene que ser mayor que cero',
            ...array_filter(PagoController::mensajes(), fn ($key) => str_starts_with($key, 'comprobante.'), ARRAY_FILTER_USE_KEY),
        ]);

        return [
            'tipo' => $data['tipo'],
            'fecha' => $data['fecha'],
            'concepto' => trim($data['concepto']),
            'categoria' => $data['categoria'],
            'monto' => (int) $data['monto'],
            'metodo' => ($data['metodo'] ?? null) ?: null,
            'nota' => ($data['nota'] ?? null) ?: null,
        ];
    }
}
