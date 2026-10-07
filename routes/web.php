<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ProfileController;
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

    // ── Solo administradores ─────────────────────────────────────────
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('usuarios', [UserController::class, 'index'])->name('admin.usuarios');
        Route::post('usuarios', [UserController::class, 'store']);
        Route::put('usuarios/{user}', [UserController::class, 'update']);
        Route::delete('usuarios/{user}', [UserController::class, 'destroy']);
    });
});
