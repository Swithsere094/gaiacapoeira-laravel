<?php

namespace App\Http\Controllers;

use App\Models\Reto;
use App\Support\Cordas;
use App\Support\RetosDemo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Mi perfil": cada usuario edita solo lo suyo (cuerda, apodo y contraseña).
 * El resto de los datos (nombre, rol, email) solo los cambia un admin desde
 * Gestión de Usuarios.
 */
class ProfileController extends Controller
{
    public function show(Request $request): Response
    {
        return Inertia::render('perfil', [
            // Medallas de retos (demo, solo admins por ahora).
            'medallas' => $request->user()->isAdmin() ? $this->medallas($request) : null,
        ]);
    }

    /**
     * Medallas por reto, de la que más tiene a la que menos.
     *
     * @return list<array{id: string, title: string, habilidad: string|null, oro: int, plata: int, bronce: int}>
     */
    private function medallas(Request $request): array
    {
        $medals = RetosDemo::progreso($request)->medals();

        return array_values(Reto::with('habilidad')->whereIn('id', array_keys($medals))->get()
            ->map(fn (Reto $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'habilidad' => $r->habilidad?->name,
                ...$medals[$r->id],
            ])
            ->sortByDesc(fn (array $m) => [$m['oro'], $m['plata'], $m['bronce']])
            ->all());
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'avatar' => ['required', 'string', Rule::in(Cordas::IDS)],
        ]);

        $request->user()->update($data);

        return back();
    }

    public function updateApodo(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'apodo' => ['nullable', 'string', 'max:60'],
        ]);

        $request->user()->update(['apodo' => trim((string) ($data['apodo'] ?? '')) ?: null]);

        return back();
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ], [
            'current_password.required' => 'Debes ingresar tu contraseña actual para cambiarla',
            'password.min' => 'La nueva contraseña debe tener al menos 8 caracteres',
            'password.confirmed' => 'Las contraseñas no coinciden',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'current_password' => 'La contraseña actual es incorrecta',
            ]);
        }

        $user->update(['password_hash' => $data['password']]);

        return back();
    }
}
