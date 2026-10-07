<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Protección general ──────────────────────────────────────────

    public function test_sin_sesion_cualquier_pagina_redirige_al_login(): void
    {
        $this->get('/')->assertRedirect('/auth/login');
    }

    public function test_las_paginas_de_auth_son_publicas(): void
    {
        $this->get('/auth/login')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
        $this->get('/auth/olvide-contrasena')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/olvide-contrasena'));
    }

    public function test_todas_las_respuestas_llevan_cache_control_private_no_store(): void
    {
        $this->get('/auth/login')->assertHeader('Cache-Control', 'no-store, private');
        $this->get('/')->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_el_usuario_compartido_con_el_frontend_no_incluye_el_hash(): void
    {
        $this->actingAsRole('member');

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('auth.user', fn (Assert $user) => $user
                ->hasAll(['id', 'username', 'name', 'email', 'role', 'apodo', 'avatar'])
                ->missing('password_hash')
            )
        );
    }

    // ── Login ───────────────────────────────────────────────────────

    public function test_login_correcto_inicia_sesion_y_va_al_inicio(): void
    {
        $user = User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        $this->post('/auth/login', ['username' => 'mestre', 'password' => 'secreto123'])
            ->assertRedirect('/');

        $this->assertAuthenticatedAs($user);
    }

    public function test_login_vuelve_a_la_pagina_que_se_intento_abrir(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        $this->get('/perfil')->assertRedirect('/auth/login');
        $this->post('/auth/login', ['username' => 'mestre', 'password' => 'secreto123'])
            ->assertRedirect('/perfil');
    }

    public function test_login_con_clave_incorrecta_no_inicia_sesion(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        $this->post('/auth/login', ['username' => 'mestre', 'password' => 'mal'])
            ->assertSessionHasErrors(['username' => 'Usuario o contraseña incorrectos']);

        $this->assertGuest();
    }

    public function test_login_exige_usuario_y_clave(): void
    {
        $this->post('/auth/login', [])->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_login_bloquea_despues_de_10_intentos_por_ip(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        for ($i = 0; $i < 10; $i++) {
            $this->post('/auth/login', ['username' => 'mestre', 'password' => 'mal']);
        }

        // Ni siquiera la clave correcta entra mientras dura el bloqueo.
        $this->post('/auth/login', ['username' => 'mestre', 'password' => 'secreto123'])
            ->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertStringContainsString('Demasiados intentos', session('errors')->first('username'));
    }

    public function test_un_usuario_con_sesion_no_ve_el_login(): void
    {
        $this->actingAsRole('member');

        $this->get('/auth/login')->assertRedirect('/');
    }

    // ── Logout ──────────────────────────────────────────────────────

    public function test_logout_cierra_la_sesion(): void
    {
        $this->actingAsRole('member');

        $this->post('/auth/logout')->assertRedirect('/auth/login');
        $this->assertGuest();
    }

    // ── Olvidé mi contraseña ────────────────────────────────────────

    public function test_olvide_contrasena_genera_una_clave_temporal_que_sirve_para_entrar(): void
    {
        $user = User::factory()->create(['username' => 'aluno', 'email' => 'aluno@gaia.com', 'password_hash' => 'vieja123']);

        $this->from('/auth/olvide-contrasena')
            ->post('/auth/olvide-contrasena', ['username' => ' Aluno ', 'email' => 'ALUNO@gaia.com'])
            ->assertRedirect('/auth/olvide-contrasena')
            ->assertSessionHas('tempPassword');

        $temp = session('tempPassword');
        $this->assertMatchesRegularExpression('/^[A-HJ-NP-Za-km-np-z2-9]{10}$/', $temp);
        $this->assertTrue(Hash::check($temp, $user->fresh()->password_hash));
        $this->assertFalse(Hash::check('vieja123', $user->fresh()->password_hash));
    }

    public function test_olvide_contrasena_con_datos_que_no_coinciden_no_cambia_nada(): void
    {
        $user = User::factory()->create(['username' => 'aluno', 'email' => 'aluno@gaia.com', 'password_hash' => 'vieja123']);

        $this->post('/auth/olvide-contrasena', ['username' => 'aluno', 'email' => 'otro@gaia.com'])
            ->assertSessionHasErrors('username')
            ->assertSessionMissing('tempPassword');

        $this->assertTrue(Hash::check('vieja123', $user->fresh()->password_hash));
    }

    public function test_olvide_contrasena_bloquea_despues_de_5_intentos_por_ip(): void
    {
        $user = User::factory()->create(['username' => 'aluno', 'email' => 'aluno@gaia.com', 'password_hash' => 'vieja123']);

        for ($i = 0; $i < 5; $i++) {
            $this->post('/auth/olvide-contrasena', ['username' => 'aluno', 'email' => 'mal@gaia.com']);
        }

        $this->post('/auth/olvide-contrasena', ['username' => 'aluno', 'email' => 'aluno@gaia.com'])
            ->assertSessionHasErrors('username')
            ->assertSessionMissing('tempPassword');

        $this->assertTrue(Hash::check('vieja123', $user->fresh()->password_hash));
    }

    public function test_al_iniciar_sesion_un_hash_heredado_se_actualiza_a_formato_php(): void
    {
        $hash = '$2b$'.substr(password_hash('secreto123', PASSWORD_BCRYPT, ['cost' => 4]), 4);
        $user = User::factory()->create(['username' => 'heredado']);
        $user->forceFill(['password_hash' => $hash])->saveQuietly();
        DB::table('usuarios')->where('id', $user->id)->update(['password_hash' => $hash]);

        $this->post('/auth/login', ['username' => 'heredado', 'password' => 'secreto123'])->assertRedirect('/');

        $this->assertStringStartsWith('$2y$', $user->fresh()->password_hash);
        Auth::logout();
    }
}
