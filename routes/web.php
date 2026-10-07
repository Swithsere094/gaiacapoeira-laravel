<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\GaleraController;
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

    // ── Solo administradores ─────────────────────────────────────────
    Route::middleware('admin')->group(function () {
        Route::delete('canciones/{song}', [SongController::class, 'destroy']);

        Route::post('galera/rodas', [GaleraController::class, 'storeRoda']);
        Route::delete('galera/rodas/{roda}', [GaleraController::class, 'destroyRoda']);
        Route::post('galera/rodas/sync', [GaleraController::class, 'syncRodas'])->middleware('throttle:6,1');
        Route::post('galera/cantorias', [GaleraController::class, 'storeCantoria']);
        Route::delete('galera/cantorias/{cantoria}', [GaleraController::class, 'destroyCantoria']);
        Route::post('galera/cantorias/sync', [GaleraController::class, 'syncCantorias'])->middleware('throttle:6,1');

        Route::prefix('admin')->group(function () {
            Route::get('usuarios', [UserController::class, 'index'])->name('admin.usuarios');
            Route::post('usuarios', [UserController::class, 'store']);
            Route::put('usuarios/{user}', [UserController::class, 'update']);
            Route::delete('usuarios/{user}', [UserController::class, 'destroy']);
        });
    });
});
