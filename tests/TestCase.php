<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Los tests no dependen de tener el frontend compilado (public/build).
        $this->withoutVite();
    }

    /** Inicia sesión como un usuario nuevo con el rol pedido. */
    protected function actingAsRole(string $role = 'member', array $attributes = []): User
    {
        $user = User::factory()->create(['role' => $role, ...$attributes]);
        $this->actingAs($user);

        return $user;
    }
}
