<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Gestión de roles (solo admin): crear, renombrar y eliminar roles, y elegir
 * sus permisos del catálogo (App\Support\Permissions).
 *
 *  - `admin` no se edita ni se elimina: tiene todos los permisos siempre.
 *  - `member` se puede editar pero no eliminar (es el rol base).
 *  - Un rol con personas asignadas no se puede eliminar.
 *  - El slug se genera del nombre al crear y no cambia después.
 */
class RoleController extends Controller
{
    public function index(): Response
    {
        $roles = Role::with('permissions')->withCount('users')->get()
            // Primero los roles base, después el resto por nombre.
            ->sortBy(fn (Role $r) => [! $r->isAdmin(), $r->slug !== Role::MEMBER, mb_strtolower($r->name)])
            ->values()
            ->map(fn (Role $r) => [
                'id' => $r->id,
                'slug' => $r->slug,
                'name' => $r->name,
                'description' => $r->description,
                'users_count' => $r->users_count,
                'permissions' => $r->isAdmin() ? Permissions::ALL : $r->permissions->pluck('slug')->values(),
                'is_admin' => $r->isAdmin(),
                'is_base' => $r->isBase(),
            ]);

        return Inertia::render('admin/roles', [
            'roles' => $roles,
            // En el orden del catálogo.
            'permissions' => Permission::whereIn('slug', Permissions::ALL)->get(['slug', 'name', 'description'])
                ->sortBy(fn (Permission $p) => array_search($p->slug, Permissions::ALL, true))
                ->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $slug = Str::slug($data['name']);

        if ($slug === '' || Role::where('slug', $slug)->exists()) {
            throw ValidationException::withMessages(['name' => 'Ya existe un rol con ese nombre']);
        }

        $role = Role::create([
            'slug' => $slug,
            'name' => $data['name'],
            'description' => ($data['description'] ?? null) ?: null,
        ]);
        $this->syncPermissions($role, $data['permissions'] ?? []);

        return back();
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        if ($role->isAdmin()) {
            throw ValidationException::withMessages(['role' => 'El rol Administrador no se puede modificar']);
        }

        $data = $this->validated($request, $role);

        $role->update([
            'name' => $data['name'],
            'description' => ($data['description'] ?? null) ?: null,
        ]);
        $this->syncPermissions($role, $data['permissions'] ?? []);

        return back();
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->isBase()) {
            throw ValidationException::withMessages(['role' => "El rol {$role->name} no se puede eliminar"]);
        }

        $count = $role->users()->count();
        if ($count > 0) {
            throw ValidationException::withMessages([
                'role' => $count === 1
                    ? 'Este rol tiene 1 persona asignada: cámbiale el rol antes de eliminarlo'
                    : "Este rol tiene {$count} personas asignadas: cámbiales el rol antes de eliminarlo",
            ]);
        }

        $role->delete();

        return back();
    }

    /** @return array{name: string, description?: string|null, permissions?: list<string>} */
    private function validated(Request $request, ?Role $role = null): array
    {
        $request->merge(['name' => trim((string) $request->input('name'))]);

        /** @var array{name: string, description?: string|null, permissions?: list<string>} */
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role?->id)],
            'description' => ['nullable', 'string', 'max:500'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(Permissions::ALL)],
        ], [
            'name.required' => 'El nombre del rol es obligatorio',
            'name.max' => 'El nombre puede tener hasta 100 caracteres',
            'name.unique' => 'Ya existe un rol con ese nombre',
            'description.max' => 'La descripción puede tener hasta 500 caracteres',
            'permissions.*.in' => 'Permiso inválido',
        ]);
    }

    /** @param list<string> $slugs */
    private function syncPermissions(Role $role, array $slugs): void
    {
        $role->permissions()->sync(Permission::whereIn('slug', $slugs)->pluck('id'));
    }
}
