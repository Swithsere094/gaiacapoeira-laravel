<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Solo para bases locales desde cero (nunca correr contra producción): crea
 * un admin de prueba. Los datos reales vienen de la base heredada.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'username' => 'admin_local',
            'password_hash' => 'admin_local_pw123',
            'name' => 'Admin local',
        ]);
    }
}
