<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\GaleraController;
use App\Http\Controllers\PoliticaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SongController;
use Illuminate\Support\Facades\Route;

// ── Público (sin sesión) ─────────────────────────────────────────────
Route::middleware('guest')->prefix('auth')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
    Route::get('olvide-contrasena', [AuthController::class, 'showForgotPassword'])->name('password.forgot');
    Route::post('olvide-contrasena', [AuthController::class, 'resetPassword']);
});

// ── Todo lo demás requiere sesión ────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout'])->name('logout');

    Route::inertia('/', 'home')->name('home');

    // Mi perfil: cada usuario edita solo lo suyo.
    Route::get('perfil', [ProfileController::class, 'show'])->name('perfil');
    Route::put('perfil/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('perfil/apodo', [ProfileController::class, 'updateApodo']);
    Route::put('perfil/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1');

    // Sabiá cantou: cualquier usuario ve, crea y edita; borrar es de admin.
    Route::get('canciones', [SongController::class, 'index'])->name('canciones');
    Route::post('canciones', [SongController::class, 'store']);
    Route::put('canciones/{song}', [SongController::class, 'update']);

    // Galera: rodas y cantorias (agregar/eliminar/sincronizar es de admin).
    Route::get('galera', [GaleraController::class, 'index'])->name('galera');
    Route::redirect('rodas', '/galera');

    // Política: documentos, sistema de cordas y manual de convivencia.
    Route::get('politica', [PoliticaController::class, 'index'])->name('politica');
    Route::inertia('politica/cordas', 'politica/cordas')->name('politica.cordas');
    Route::inertia('politica/manual', 'politica/manual')->name('politica.manual');

    // Páginas de ejemplo (contenido fijo, todavía sin base de datos).
    Route::inertia('articulos', 'articulos')->name('articulos');
    Route::inertia('movimientos', 'movimientos')->name('movimientos');
    Route::inertia('portugues', 'portugues')->name('portugues');

    // ── Solo administradores ─────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::delete('canciones/{song}', [SongController::class, 'destroy']);

        Route::post('galera/rodas', [GaleraController::class, 'storeRoda']);
        Route::delete('galera/rodas/{roda}', [GaleraController::class, 'destroyRoda']);
        Route::post('galera/rodas/sync', [GaleraController::class, 'syncRodas'])->middleware('throttle:6,1');
        Route::post('galera/cantorias', [GaleraController::class, 'storeCantoria']);
        Route::delete('galera/cantorias/{cantoria}', [GaleraController::class, 'destroyCantoria']);
        Route::post('galera/cantorias/sync', [GaleraController::class, 'syncCantorias'])->middleware('throttle:6,1');

        // Con archivo adjunto: el formulario manda POST + _method=PUT
        // (PHP no interpreta multipart en un PUT real).
        Route::post('politica', [PoliticaController::class, 'store']);
        Route::put('politica/{politica}', [PoliticaController::class, 'update']);
        Route::delete('politica/{politica}', [PoliticaController::class, 'destroy']);

        Route::prefix('admin')->group(function () {
            Route::get('analytics', [AnalyticsController::class, 'index'])->name('admin.analytics');
            Route::get('usuarios', [UserController::class, 'index'])->name('admin.usuarios');
            Route::post('usuarios', [UserController::class, 'store']);
            Route::put('usuarios/{user}', [UserController::class, 'update']);
            Route::delete('usuarios/{user}', [UserController::class, 'destroy']);
        });
    });
});
