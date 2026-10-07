<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\ClientIp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Login y logout. Login por username, sin registro público (los usuarios los
 * crea un admin) y sin "recordarme", como el sitio anterior.
 *
 * No hay "olvidé mi contraseña" de autoservicio (decisión del 2026-10-07,
 * auditoría P1): el del sitio anterior permitía tomar cualquier cuenta
 * conociendo su usuario y email. Si alguien olvida su contraseña, un admin
 * le asigna una nueva desde Gestión de Usuarios.
 *
 * El límite de intentos va por IP del visitante (App\Support\ClientIp) y
 * cuenta cada intento. A diferencia del sitio anterior (un Map en memoria
 * que se perdía en cada reinicio) el contador vive en la caché de Laravel
 * (tabla `cache`), así que sobrevive a reinicios y despliegues.
 */
class AuthController extends Controller
{
    private const LOGIN_LIMIT = 10;

    private const WINDOW_SECONDS = 15 * 60;

    public function showLogin(): Response
    {
        return Inertia::render('auth/login');
    }

    public function login(Request $request): RedirectResponse
    {
        $this->throttle('login:'.ClientIp::for($request));

        $credentials = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ], [
            'username.required' => 'Usuario y contraseña requeridos',
            'password.required' => 'Usuario y contraseña requeridos',
        ]);

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'username' => 'Usuario o contraseña incorrectos',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended('/');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/auth/login');
    }

    private function throttle(string $key): void
    {
        if (RateLimiter::tooManyAttempts($key, self::LOGIN_LIMIT)) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            throw ValidationException::withMessages([
                'username' => "Demasiados intentos. Probá de nuevo en {$minutes} minuto(s).",
            ])->status(429);
        }

        RateLimiter::hit($key, self::WINDOW_SECONDS);
    }
}
