<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ClientIp;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/** Configuración de seguridad transversal (auditoría, fase 5.2). */
class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_cabeceras_de_seguridad_en_paginas_y_errores(): void
    {
        foreach (['/auth/login', '/no-existe'] as $url) {
            $this->get($url)
                ->assertHeader('X-Content-Type-Options', 'nosniff')
                ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
                ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
                ->assertHeader('Permissions-Policy');
        }
    }

    public function test_hsts_solo_por_https(): void
    {
        $this->get('/auth/login')->assertHeaderMissing('Strict-Transport-Security');
        $this->get('https://localhost/auth/login')->assertHeader('Strict-Transport-Security');
    }

    public function test_detras_del_proxy_se_usa_la_ip_que_agrego_el_proxy(): void
    {
        $seen = null;
        Route::get('/__test/ip', function () use (&$seen) {
            $seen = ClientIp::for(request());

            return 'ok';
        });

        // El visitante inventa una IP al principio; el proxy agrega la real al final.
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->withHeader('X-Forwarded-For', '6.6.6.6, 203.0.113.7')
            ->get('/__test/ip')->assertOk();

        $this->assertSame('203.0.113.7', $seen);
    }

    public function test_el_limite_de_login_es_por_visitante_y_no_global_detras_del_proxy(): void
    {
        User::factory()->create(['username' => 'mestre', 'password_hash' => 'secreto123']);

        // Un atacante agota sus 10 intentos...
        for ($i = 0; $i < 10; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
                ->withHeader('X-Forwarded-For', '198.51.100.1')
                ->post('/auth/login', ['username' => 'mestre', 'password' => 'mal']);
        }

        // ...y otra persona, detrás del mismo proxy, igual puede entrar.
        $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
            ->withHeader('X-Forwarded-For', '203.0.113.7')
            ->post('/auth/login', ['username' => 'mestre', 'password' => 'secreto123'])
            ->assertRedirect('/');

        $this->assertAuthenticated();
    }
}
