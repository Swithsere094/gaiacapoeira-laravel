<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Testing\TestResponse;
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

    public function test_el_login_es_publico(): void
    {
        $this->get('/auth/login')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/login'));
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

    /** Envía un intento de login como si viniera de la IP dada (vía el proxy). */
    private function loginFrom(string $ip, string $username, string $password): TestResponse
    {
        return $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->withHeader('X-Forwarded-For', $ip)
            ->post('/auth/login', ['username' => $username, 'password' => $password]);
    }

    public function test_login_bloquea_una_cuenta_tras_10_fallos_aunque_vengan_de_ips_distintas(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        for ($i = 1; $i <= 10; $i++) {
            $this->loginFrom("198.51.100.{$i}", 'MESTRE', 'mal');
        }

        // Desde una IP nueva y con la clave correcta: la cuenta sigue bloqueada.
        $this->loginFrom('203.0.113.50', 'mestre', 'secreto123')->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->assertStringContainsString('Demasiados intentos', session('errors')->first('username'));
    }

    public function test_el_bloqueo_por_usuario_no_afecta_a_otras_cuentas(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);
        $otro = User::factory()->create(['username' => 'aluno', 'password_hash' => 'clave4567']);

        for ($i = 1; $i <= 10; $i++) {
            $this->loginFrom("198.51.100.{$i}", 'mestre', 'mal');
        }

        $this->loginFrom('203.0.113.50', 'aluno', 'clave4567')->assertRedirect('/');
        $this->assertAuthenticatedAs($otro);
    }

    public function test_un_login_correcto_reinicia_el_contador_de_la_cuenta(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        for ($i = 1; $i <= 9; $i++) {
            $this->loginFrom("198.51.100.{$i}", 'mestre', 'mal');
        }
        $this->loginFrom('198.51.100.20', 'mestre', 'secreto123')->assertRedirect('/');
        $this->post('/auth/logout');

        // Si el contador no se hubiera reiniciado, 2 fallos más llegarían a 11.
        $this->loginFrom('198.51.100.21', 'mestre', 'mal');
        $this->loginFrom('198.51.100.22', 'mestre', 'mal');
        $this->loginFrom('198.51.100.23', 'mestre', 'secreto123')->assertRedirect('/');
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

    // ── Sin "olvidé mi contraseña" (auditoría P1) ───────────────────

    public function test_la_direccion_vieja_de_olvide_contrasena_lleva_al_login(): void
    {
        $this->get('/auth/olvide-contrasena')->assertRedirect('/auth/login');
    }

    public function test_nadie_puede_cambiar_una_contrasena_sin_sesion(): void
    {
        $user = User::factory()->create(['username' => 'aluno', 'email' => 'aluno@gaia.com', 'password_hash' => 'vieja123']);

        // Lo que hacía el formulario anterior ya no hace nada.
        $this->post('/auth/olvide-contrasena', ['username' => 'aluno', 'email' => 'aluno@gaia.com'])
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
