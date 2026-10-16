<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Politica;
use App\Models\Role;
use App\Models\Song;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Roles y permisos (tablas `roles`, `permissions`, `permission_role`). */
class RolesTest extends TestCase
{
    use RefreshDatabase;

    /** Crea un rol con esos permisos y devuelve su slug. */
    private function roleWith(array $permissions, string $slug = 'profesor'): string
    {
        $role = Role::create(['slug' => $slug, 'name' => ucfirst($slug)]);
        $role->permissions()->sync(Permission::whereIn('slug', $permissions)->pluck('id'));

        return $slug;
    }

    // ── Base y catálogo ─────────────────────────────────────────────

    public function test_el_catalogo_del_codigo_y_la_tabla_permissions_coinciden(): void
    {
        $this->assertEqualsCanonicalizing(Permissions::ALL, Permission::pluck('slug')->all());
    }

    public function test_la_migracion_crea_los_roles_base(): void
    {
        $this->assertEqualsCanonicalizing([Role::ADMIN, Role::MEMBER], Role::pluck('slug')->all());
        // El admin no necesita filas: tiene todo siempre.
        $this->assertSame(0, Role::where('slug', Role::ADMIN)->first()->permissions()->count());
    }

    public function test_la_columna_vieja_role_se_mantiene_al_dia(): void
    {
        $user = User::factory()->create();
        $this->assertSame('member', DB::table('usuarios')->where('id', $user->id)->value('role'));

        $user->update(['role_id' => Role::idFor(Role::ADMIN)]);
        $this->assertSame('admin', DB::table('usuarios')->where('id', $user->id)->value('role'));

        // Un rol nuevo, para la versión anterior del sitio, es 'member'.
        $user->update(['role_id' => Role::idFor($this->roleWith([Permissions::GALERA_GESTIONAR]))]);
        $this->assertSame('member', DB::table('usuarios')->where('id', $user->id)->value('role'));
    }

    public function test_no_se_puede_borrar_en_la_base_un_rol_con_personas(): void
    {
        $slug = $this->roleWith([]);
        User::factory()->withRole($slug)->create();

        $this->expectException(QueryException::class);
        Role::where('slug', $slug)->delete();
    }

    // ── Permisos en acción ──────────────────────────────────────────

    public function test_el_admin_tiene_todos_los_permisos_y_el_miembro_ninguno(): void
    {
        $admin = User::factory()->admin()->create();
        $member = User::factory()->create();

        foreach (Permissions::ALL as $p) {
            $this->assertTrue($admin->can($p), $p);
            $this->assertFalse($member->can($p), $p);
        }
    }

    public function test_un_rol_con_permiso_de_galera_gestiona_la_galera_y_nada_mas(): void
    {
        $this->actingAsRole($this->roleWith([Permissions::GALERA_GESTIONAR]));
        $song = Song::factory()->create();
        $doc = Politica::factory()->create();

        $this->post('/galera/rodas', ['title' => 'Roda', 'video_url' => 'https://youtu.be/dQw4w9WgXcQ'])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('rodas', ['title' => 'Roda']);

        $this->delete("/canciones/{$song->id}")->assertForbidden();
        $this->delete("/politica/{$doc->id}")->assertForbidden();
        $this->get('/admin/analytics')->assertForbidden();
        $this->get('/admin/usuarios')->assertForbidden();
        $this->get('/admin/roles')->assertForbidden();
    }

    public function test_cada_permiso_abre_su_ruta(): void
    {
        $this->actingAsRole($this->roleWith([
            Permissions::ANALITICAS_VER, Permissions::POLITICA_GESTIONAR, Permissions::CANCIONES_ELIMINAR,
        ]));
        $song = Song::factory()->create();
        $doc = Politica::factory()->create();

        $this->get('/admin/analytics')->assertOk();
        $this->delete("/politica/{$doc->id}")->assertSessionHasNoErrors();
        $this->delete("/canciones/{$song->id}")->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('politica', ['id' => $doc->id]);
        $this->assertDatabaseMissing('songs', ['id' => $song->id]);
    }

    public function test_el_permiso_nossa_deja_cambiar_la_marca_al_editar(): void
    {
        $song = Song::factory()->create(['nossa' => false]);
        $payload = ['title' => $song->title, 'type' => $song->type, 'lyrics' => $song->lyrics, 'nossa' => true];

        $this->actingAsRole('member');
        $this->put("/canciones/{$song->id}", $payload);
        $this->assertFalse($song->fresh()->nossa);

        $this->actingAsRole($this->roleWith([Permissions::CANCIONES_NOSSA]));
        $this->put("/canciones/{$song->id}", $payload);
        $this->assertTrue($song->fresh()->nossa);
    }

    public function test_el_frontend_recibe_el_rol_y_los_permisos(): void
    {
        $this->actingAsRole($this->roleWith([Permissions::GALERA_GESTIONAR]));

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('auth.user.role', 'profesor')
            ->where('auth.user.role_name', 'Profesor')
            ->where('auth.permissions', [Permissions::GALERA_GESTIONAR])
        );

        $this->actingAsRole('admin');
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('auth.permissions', Permissions::ALL));
    }

    // ── Gestión de Roles ────────────────────────────────────────────

    public function test_solo_el_admin_entra_a_gestion_de_roles(): void
    {
        $this->actingAsRole('member');
        $this->get('/admin/roles')->assertForbidden();
        $this->post('/admin/roles', ['name' => 'Profesor'])->assertForbidden();

        $this->actingAsRole('admin');
        $this->get('/admin/roles')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/roles')
            ->has('roles', 2)
            ->where('roles.0.slug', Role::ADMIN)
            ->where('roles.0.permissions', Permissions::ALL)
            ->has('permissions', count(Permissions::ALL))
        );
    }

    public function test_crea_un_rol_con_permisos(): void
    {
        $this->actingAsRole('admin');

        $this->post('/admin/roles', [
            'name' => '  Profesor Guía ', 'description' => 'Da clases',
            'permissions' => [Permissions::GALERA_GESTIONAR, Permissions::ANALITICAS_VER],
        ])->assertSessionHasNoErrors();

        $role = Role::where('slug', 'profesor-guia')->firstOrFail();
        $this->assertSame('Profesor Guía', $role->name);
        $this->assertEqualsCanonicalizing(
            [Permissions::GALERA_GESTIONAR, Permissions::ANALITICAS_VER],
            $role->permissions->pluck('slug')->all(),
        );
    }

    public function test_valida_nombre_repetido_y_permisos_inexistentes(): void
    {
        $this->actingAsRole('admin');

        $this->post('/admin/roles', ['name' => 'Miembro'])->assertSessionHasErrors(['name' => 'Ya existe un rol con ese nombre']);
        // Otro nombre que daría el slug de un rol existente.
        $this->post('/admin/roles', ['name' => 'Admin'])->assertSessionHasErrors(['name' => 'Ya existe un rol con ese nombre']);
        $this->post('/admin/roles', ['name' => ''])->assertSessionHasErrors('name');
        $this->post('/admin/roles', ['name' => 'Guía', 'permissions' => ['usuarios.gestionar']])->assertSessionHasErrors('permissions.0');

        $this->assertSame(2, Role::count());
    }

    public function test_edita_nombre_y_permisos_sin_cambiar_el_slug(): void
    {
        $this->actingAsRole('admin');
        $slug = $this->roleWith([Permissions::GALERA_GESTIONAR]);
        $role = Role::where('slug', $slug)->first();

        $this->put("/admin/roles/{$role->id}", ['name' => 'Guía', 'permissions' => [Permissions::POLITICA_GESTIONAR]])
            ->assertSessionHasNoErrors();

        $role->refresh();
        $this->assertSame('Guía', $role->name);
        $this->assertSame('profesor', $role->slug);
        $this->assertSame([Permissions::POLITICA_GESTIONAR], $role->permissions->pluck('slug')->all());
    }

    public function test_el_rol_admin_no_se_edita_ni_se_elimina(): void
    {
        $this->actingAsRole('admin');
        $admin = Role::where('slug', Role::ADMIN)->first();

        $this->put("/admin/roles/{$admin->id}", ['name' => 'Jefe', 'permissions' => []])
            ->assertSessionHasErrors(['role' => 'El rol Administrador no se puede modificar']);
        $this->delete("/admin/roles/{$admin->id}")->assertSessionHasErrors('role');

        $this->assertSame('Administrador', $admin->fresh()->name);
    }

    public function test_el_rol_miembro_se_edita_pero_no_se_elimina(): void
    {
        $this->actingAsRole('admin');
        $member = Role::where('slug', Role::MEMBER)->first();

        $this->put("/admin/roles/{$member->id}", ['name' => 'Miembro', 'permissions' => [Permissions::CANCIONES_NOSSA]])
            ->assertSessionHasNoErrors();
        $this->assertSame([Permissions::CANCIONES_NOSSA], $member->fresh()->permissions->pluck('slug')->all());

        $this->delete("/admin/roles/{$member->id}")->assertSessionHasErrors(['role' => 'El rol Miembro no se puede eliminar']);
        $this->assertNotNull($member->fresh());
    }

    public function test_no_elimina_un_rol_con_personas_asignadas(): void
    {
        $this->actingAsRole('admin');
        $slug = $this->roleWith([]);
        $role = Role::where('slug', $slug)->first();
        $user = User::factory()->withRole($slug)->create();

        $this->delete("/admin/roles/{$role->id}")->assertSessionHasErrors([
            'role' => 'Este rol tiene 1 persona asignada: cámbiale el rol antes de eliminarlo',
        ]);

        $user->update(['role_id' => Role::idFor(Role::MEMBER)]);
        $this->delete("/admin/roles/{$role->id}")->assertSessionHasNoErrors();
        $this->assertNull($role->fresh());
    }

    public function test_gestion_de_usuarios_asigna_roles_nuevos(): void
    {
        $this->actingAsRole('admin');
        $slug = $this->roleWith([Permissions::GALERA_GESTIONAR]);
        $user = User::factory()->create();

        $this->get('/admin/usuarios')->assertInertia(fn (Assert $page) => $page->has('roles', 3));

        $this->put("/admin/usuarios/{$user->id}", ['name' => $user->name, 'role' => $slug])->assertSessionHasNoErrors();

        $this->assertSame($slug, $user->fresh()->rol->slug);
        $this->assertTrue($user->fresh()->can(Permissions::GALERA_GESTIONAR));
    }
}
