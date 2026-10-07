<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/** Gestión de usuarios (solo admin): listar, crear, editar y eliminar. */
class UserController extends Controller
{
    private const PUBLIC_FIELDS = ['id', 'username', 'name', 'email', 'role', 'apodo', 'avatar'];

    public function index(): Response
    {
        return Inertia::render('admin/usuarios', [
            'users' => User::orderBy('created_at')->get(self::PUBLIC_FIELDS),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->merge(['username' => mb_strtolower(preg_replace('/\s+/', '', (string) $request->input('username')))]);

        $data = $request->validate([
            'username' => ['required', 'string', 'max:255', Rule::unique('usuarios', 'username')],
            'password' => ['required', 'string', 'min:8', 'max:255'],
            ...$this->profileRules(),
        ], $this->messages());

        User::create([
            'username' => $data['username'],
            'password_hash' => $data['password'],
            'name' => $data['name'],
            'email' => ($data['email'] ?? null) ?: null,
            'role' => $data['role'],
            'apodo' => ($data['apodo'] ?? null) ?: null,
        ]);

        return back();
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            ...$this->profileRules(),
        ], $this->messages());

        // Un admin no puede quitarse su propio rol (auditoría P4): junto con
        // no poder eliminarse a sí mismo, garantiza que siempre quede al
        // menos un admin (el que está haciendo los cambios).
        if ($request->user()->is($user) && $data['role'] !== 'admin') {
            throw ValidationException::withMessages([
                'role' => 'No puedes quitarte tu propio rol de administrador',
            ]);
        }

        $updates = [
            'name' => $data['name'],
            'email' => ($data['email'] ?? null) ?: null,
            'role' => $data['role'],
            'apodo' => ($data['apodo'] ?? null) ?: null,
        ];

        if (! empty($data['password'])) {
            $updates['password_hash'] = $data['password'];
        }

        $user->update($updates);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            throw ValidationException::withMessages(['user' => 'No puedes eliminarte a ti mismo']);
        }

        $user->delete();

        return back();
    }

    /** @return array<string, array<int, mixed>> */
    private function profileRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'member'])],
            'apodo' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    private function messages(): array
    {
        return [
            'username.unique' => 'El nombre de usuario ya existe',
            'username.required' => 'Usuario, contraseña, nombre y rol son obligatorios',
            'password.required' => 'La contraseña es obligatoria para nuevos usuarios',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres',
            'name.required' => 'Usuario, contraseña, nombre y rol son obligatorios',
            'role.in' => 'Rol inválido',
            'email.email' => 'El email no es válido',
        ];
    }
}
