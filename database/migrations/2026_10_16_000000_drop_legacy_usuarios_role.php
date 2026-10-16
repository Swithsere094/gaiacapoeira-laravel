<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Último paso de la transición de roles (ver create_roles_and_permissions):
 * borra la columna vieja `usuarios.role` y `role_id` pasa a ser obligatorio.
 * El usuario confirmó (2026-10-15) que nadie más usa esa columna.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Por si alguien quedó sin rol (ej. creado por la versión anterior
        // durante una vuelta atrás): se le asigna según la columna vieja.
        $roleId = fn (string $slug) => DB::table('roles')->where('slug', $slug)->value('id');
        DB::table('usuarios')->whereNull('role_id')->where('role', 'admin')->update(['role_id' => $roleId('admin')]);
        DB::table('usuarios')->whereNull('role_id')->update(['role_id' => $roleId('member')]);

        Schema::table('usuarios', function (Blueprint $table) {
            $table->char('role_id', 36)->nullable(false)->change();
            $table->dropColumn('role');
        });
    }

    /** Vuelve a crear `role` desde `role_id` (los roles nuevos, como 'member'). */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->enum('role', ['admin', 'member'])->default('member')->after('email');
            $table->char('role_id', 36)->nullable()->change();
        });

        $adminId = DB::table('roles')->where('slug', 'admin')->value('id');
        DB::table('usuarios')->where('role_id', $adminId)->update(['role' => 'admin']);
    }
};
