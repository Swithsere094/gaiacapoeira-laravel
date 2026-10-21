<?php

namespace App\Http\Controllers;

use App\Models\Habilidad;
use App\Models\Reto;
use App\Support\Cordas;
use App\Support\RetosAcceso;
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
            // Medallas de los retos que la persona ve (Entrenar, el árbol).
            'medallas' => RetosAcceso::misRetos($request->user()) ? $this->medallas($request) : null,
        ]);
    }

    /**
     * Vitrina de medallas: todos los retos semanales que la persona ve (los de
     * práctica de cada habilidad y los de Entrenar), con las medallas ganadas
     * en cada uno (0 = por ganar), agrupados por árbol y en el orden del árbol.
     *
     * @return list<array{id: string, title: string, group: string, habilidad: string|null, icon: string|null, category: string|null, oro: int, plata: int, bronce: int}>
     */
    private function medallas(Request $request): array
    {
        $medals = RetosDemo::progreso($request)->medals();
        $none = ['oro' => 0, 'plata' => 0, 'bronce' => 0];

        return array_values(Reto::with('habilidad')
            ->whereIn('kind', array_values(array_intersect([Reto::PRACTICA, Reto::SUELTO], RetosAcceso::kinds($request->user()))))
            ->get()
            ->sortBy(fn (Reto $r) => [
                $r->habilidad ? array_search($r->habilidad->tree, Habilidad::TREES, true) : 99,
                $r->habilidad->sort_order ?? $r->sort_order,
            ])
            ->map(fn (Reto $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'group' => $r->habilidad->tree ?? 'sueltos',
                'habilidad' => $r->habilidad?->name,
                'icon' => $r->habilidad?->icon,
                'category' => $r->category,
                ...($medals[$r->id] ?? $none),
            ])
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
