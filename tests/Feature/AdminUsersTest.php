<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminUsersTest extends TestCase
{
    use RefreshDatabase;

    private array $valid = [
        'username' => 'Maria Batizado',
        'password' => 'clave123',
        'name' => 'María García',
        'email' => 'maria@gaia.com',
        'role' => 'member',
        'apodo' => 'Mariposa',
    ];

    public function test_un_miembro_no_puede_entrar_ni_operar(): void
    {
        $member = $this->actingAsRole('member');
        $other = User::factory()->create();

        $this->get('/admin/usuarios')->assertForbidden();
        $this->post('/admin/usuarios', $this->valid)->assertForbidden();
        $this->put("/admin/usuarios/{$other->id}", ['name' => 'X', 'role' => 'admin'])->assertForbidden();
        $this->delete("/admin/usuarios/{$other->id}")->assertForbidden();

        $this->assertDatabaseHas('usuarios', ['id' => $other->id]);
        $this->assertSame('member', $member->fresh()->role);
    }

    public function test_lista_los_usuarios_sin_exponer_hashes(): void
    {
        $this->actingAsRole('admin');
        User::factory()->count(2)->create();

        $this->get('/admin/usuarios')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('admin/usuarios')
            ->has('users', 3, fn (Assert $u) => $u
                ->hasAll(['id', 'username', 'name', 'email', 'role', 'apodo', 'avatar'])
                ->missing('password_hash')
            )
        );
    }

    public function test_crea_un_usuario_normalizando_el_username(): void
    {
        $this->actingAsRole('admin');

        $this->post('/admin/usuarios', $this->valid)->assertSessionHasNoErrors();

        $created = User::where('username', 'mariabatizado')->first();
        $this->assertNotNull($created);
        $this->assertTrue(Hash::check('clave123', $created->password_hash));
        $this->assertSame('member', $created->role);
    }

    public function test_no_permite_usernames_repetidos(): void
    {
        $this->actingAsRole('admin');
        User::factory()->create(['username' => 'mariabatizado']);

        $this->post('/admin/usuarios', $this->valid)
            ->assertSessionHasErrors(['username' => 'El nombre de usuario ya existe']);
    }

    public function test_valida_rol_contrasena_y_campos_obligatorios(): void
    {
        $this->actingAsRole('admin');

        $this->post('/admin/usuarios', [...$this->valid, 'role' => 'superadmin'])->assertSessionHasErrors('role');
        $this->post('/admin/usuarios', [...$this->valid, 'password' => '123'])->assertSessionHasErrors('password');
        $this->post('/admin/usuarios', [...$this->valid, 'name' => ''])->assertSessionHasErrors('name');
        $this->assertDatabaseCount('usuarios', 1);
    }

    public function test_edita_un_usuario_sin_tocar_la_contrasena_si_viene_vacia(): void
    {
        $this->actingAsRole('admin');
        $user = User::factory()->create(['password_hash' => 'original1']);

        $this->put("/admin/usuarios/{$user->id}", [
            'name' => 'Nuevo Nombre', 'email' => '', 'role' => 'admin', 'apodo' => '', 'password' => '',
        ])->assertSessionHasNoErrors();

        $fresh = $user->fresh();
        $this->assertSame('Nuevo Nombre', $fresh->name);
        $this->assertSame('admin', $fresh->role);
        $this->assertNull($fresh->email);
        $this->assertTrue(Hash::check('original1', $fresh->password_hash));
    }

    public function test_el_admin_puede_resetear_la_contrasena_de_otro(): void
    {
        $this->actingAsRole('admin');
        $user = User::factory()->create(['password_hash' => 'original1']);

        $this->put("/admin/usuarios/{$user->id}", [
            'name' => $user->name, 'role' => 'member', 'password' => 'nueva789',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('nueva789', $user->fresh()->password_hash));
    }

    public function test_elimina_un_usuario(): void
    {
        $this->actingAsRole('admin');
        $user = User::factory()->create();

        $this->delete("/admin/usuarios/{$user->id}")->assertSessionHasNoErrors();

        $this->assertDatabaseMissing('usuarios', ['id' => $user->id]);
    }

    public function test_un_admin_no_puede_eliminarse_a_si_mismo(): void
    {
        $admin = $this->actingAsRole('admin');

        $this->delete("/admin/usuarios/{$admin->id}")
            ->assertSessionHasErrors(['user' => 'No puedes eliminarte a ti mismo']);

        $this->assertDatabaseHas('usuarios', ['id' => $admin->id]);
    }

    public function test_editar_un_usuario_inexistente_da_404(): void
    {
        $this->actingAsRole('admin');

        $this->put('/admin/usuarios/00000000-0000-0000-0000-000000000000', ['name' => 'X', 'role' => 'member'])
            ->assertNotFound();
    }
}
