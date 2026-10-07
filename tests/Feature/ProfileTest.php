<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_el_perfil_requiere_sesion(): void
    {
        $this->get('/perfil')->assertRedirect('/auth/login');
    }

    public function test_muestra_el_perfil(): void
    {
        $this->actingAsRole('member');

        $this->get('/perfil')->assertOk()->assertInertia(fn (Assert $page) => $page->component('perfil'));
    }

    public function test_guarda_una_cuerda_valida(): void
    {
        $user = $this->actingAsRole('member');

        $this->put('/perfil/avatar', ['avatar' => 'graduado'])->assertSessionHasNoErrors();

        $this->assertSame('graduado', $user->fresh()->avatar);
    }

    public function test_rechaza_una_cuerda_que_no_existe(): void
    {
        $user = $this->actingAsRole('member');

        $this->put('/perfil/avatar', ['avatar' => '../../etc/passwd'])->assertSessionHasErrors('avatar');

        $this->assertNull($user->fresh()->avatar);
    }

    public function test_guarda_y_borra_el_apodo(): void
    {
        $user = $this->actingAsRole('member');

        $this->put('/perfil/apodo', ['apodo' => '  Mariposa do Mar  ']);
        $this->assertSame('Mariposa do Mar', $user->fresh()->apodo);

        $this->put('/perfil/apodo', ['apodo' => '']);
        $this->assertNull($user->fresh()->apodo);
    }

    public function test_el_apodo_tiene_un_maximo_de_60_caracteres(): void
    {
        $this->actingAsRole('member');

        $this->put('/perfil/apodo', ['apodo' => str_repeat('a', 61)])->assertSessionHasErrors('apodo');
    }

    public function test_cambia_la_contrasena_con_la_actual_correcta(): void
    {
        $user = $this->actingAsRole('member', ['password_hash' => 'vieja123']);

        $this->put('/perfil/password', [
            'current_password' => 'vieja123',
            'password' => 'nueva456',
            'password_confirmation' => 'nueva456',
        ])->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('nueva456', $user->fresh()->password_hash));
    }

    public function test_no_cambia_la_contrasena_si_la_actual_es_incorrecta(): void
    {
        $user = $this->actingAsRole('admin', ['password_hash' => 'vieja123']);

        $this->put('/perfil/password', [
            'current_password' => 'mal',
            'password' => 'nueva456',
            'password_confirmation' => 'nueva456',
        ])->assertSessionHasErrors(['current_password' => 'La contraseña actual es incorrecta']);

        $this->assertTrue(Hash::check('vieja123', $user->fresh()->password_hash));
    }

    public function test_la_nueva_contrasena_necesita_6_caracteres_y_confirmacion(): void
    {
        $this->actingAsRole('member', ['password_hash' => 'vieja123']);

        $this->put('/perfil/password', [
            'current_password' => 'vieja123', 'password' => '123', 'password_confirmation' => '123',
        ])->assertSessionHasErrors('password');

        $this->put('/perfil/password', [
            'current_password' => 'vieja123', 'password' => 'nueva456', 'password_confirmation' => 'otra456',
        ])->assertSessionHasErrors('password');
    }

    public function test_un_usuario_no_puede_cambiar_su_rol_desde_el_perfil(): void
    {
        $user = $this->actingAsRole('member');

        // El perfil ignora cualquier campo que no le corresponde.
        $this->put('/perfil/apodo', ['apodo' => 'x', 'role' => 'admin']);

        $this->assertSame('member', $user->fresh()->role);
    }
}
