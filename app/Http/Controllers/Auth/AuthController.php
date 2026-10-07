<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Login, logout y "olvidé mi contraseña". Mismo comportamiento que el sitio
 * Next (ver CLAUDE.md, sección Auth): login por username, sin registro
 * público (los usuarios los crea un admin) y sin "recordarme".
 *
 * Los límites de intentos van por IP y cuentan cada intento, como antes.
 * A diferencia del sitio anterior (un Map en memoria que se perdía en cada
 * reinicio) el contador vive en la caché de Laravel (tabla `cache`), así que
 * sobrevive a reinicios y despliegues.
 */
class AuthController extends Controller
{
    private const LOGIN_LIMIT = 10;

    private const RESET_LIMIT = 5;

    private const WINDOW_SECONDS = 15 * 60;

    /**
     * Caracteres de la contraseña temporal: sin los que se confunden al
     * leerlos (0/O, 1/l/I).
     */
    private const TEMP_PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

    public function showLogin(): Response
    {
        return Inertia::render('auth/login');
    }

    public function login(Request $request): RedirectResponse
    {
        $this->throttle('login:'.$request->ip(), self::LOGIN_LIMIT, 'username');

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

    public function showForgotPassword(): Response
    {
        return Inertia::render('auth/olvide-contrasena');
    }

    /**
     * Si usuario + email coinciden, genera una contraseña temporal, la guarda
     * hasheada y la muestra una sola vez (flash de sesión).
     */
    public function resetPassword(Request $request): RedirectResponse
    {
        // Más estricto que login: un intento exitoso entrega una contraseña.
        $this->throttle('olvide:'.$request->ip(), self::RESET_LIMIT, 'username');

        $data = $request->validate([
            'username' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'max:255'],
        ], [
            'username.required' => 'Usuario y email son obligatorios',
            'email.required' => 'Usuario y email son obligatorios',
        ]);

        $user = User::where('username', mb_strtolower(trim($data['username'])))
            ->where('email', mb_strtolower(trim($data['email'])))
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'username' => 'No encontramos un usuario con ese nombre y email. Verifica los datos o contacta al administrador.',
            ]);
        }

        $tempPassword = $this->generateTempPassword();
        $user->update(['password_hash' => $tempPassword]);

        return back()->with('tempPassword', $tempPassword);
    }

    private function throttle(string $key, int $limit, string $errorField): void
    {
        if (RateLimiter::tooManyAttempts($key, $limit)) {
            $minutes = (int) ceil(RateLimiter::availableIn($key) / 60);

            throw ValidationException::withMessages([
                $errorField => "Demasiados intentos. Probá de nuevo en {$minutes} minuto(s).",
            ])->status(429);
        }

        RateLimiter::hit($key, self::WINDOW_SECONDS);
    }

    private function generateTempPassword(): string
    {
        $chars = self::TEMP_PASSWORD_CHARS;
        $max = strlen($chars) - 1;
        $password = '';

        for ($i = 0; $i < 10; $i++) {
            $password .= $chars[random_int(0, $max)];
        }

        return $password;
    }
}
