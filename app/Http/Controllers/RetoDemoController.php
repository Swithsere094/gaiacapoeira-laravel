<?php

namespace App\Http\Controllers;

use App\Models\Entrenamiento;
use App\Models\RetoSemana;
use App\Models\Revision;
use App\Support\RetosDemo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Controles de prueba del demo de retos (ver App\Support\RetosDemo). Solo
 * afectan a quien los usa.
 */
class RetoDemoController extends Controller
{
    public function nextDay(Request $request): RedirectResponse
    {
        RetosDemo::nextDay($request);

        return back();
    }

    public function backToToday(Request $request): RedirectResponse
    {
        RetosDemo::backToToday($request);

        return back();
    }

    public function toggleFast(Request $request): RedirectResponse
    {
        RetosDemo::toggleFast($request);

        return back();
    }

    /** Borra todo el progreso propio (semanas, entrenamientos, árbol, revisiones). */
    public function reset(Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        DB::transaction(function () use ($userId) {
            Entrenamiento::where('user_id', $userId)->delete();
            RetoSemana::where('user_id', $userId)->delete();
            Revision::where('user_id', $userId)->delete();
            DB::table('habilidades_dominadas')->where('user_id', $userId)->delete();
        });

        RetosDemo::backToToday($request);

        return back()->with('success', 'Tu progreso de retos quedó en cero.');
    }
}
