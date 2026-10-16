<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Roles y permisos en la base (antes el rol era el ENUM `usuarios.role`
 * con 'admin' | 'member').
 *
 *  - `roles`: los roles del sitio. `admin` y `member` son los roles base.
 *  - `permissions`: el catálogo de permisos. Lo define el código
 *    (App\Support\Permissions): cada permiso nuevo llega con su migración.
 *  - `permission_role`: qué permisos tiene cada rol.
 *  - `usuarios.role_id`: el rol de cada persona (uno solo).
 *
 * El rol `admin` no necesita filas en `permission_role`: tiene todo siempre.
 *
 * Transición: la columna vieja `usuarios.role` se conservó (al día) por una
 * publicación, por si el servidor volvía solo a la versión anterior. La
 * borra drop_legacy_usuarios_role, que también deja `role_id` NOT NULL.
 */
return new class extends Migration
{
    /** Permisos iniciales: lo que hasta hoy hacía solo el admin. */
    private const PERMISSIONS = [
        ['analiticas.ver', 'Ver analíticas', 'Entrar al panel de analíticas del sitio.'],
        ['galera.gestionar', 'Gestionar la galera', 'Agregar y eliminar rodas y cantorias, y sincronizarlas con YouTube.'],
        ['politica.gestionar', 'Gestionar documentos de política', 'Crear, editar y eliminar documentos de política.'],
        ['canciones.eliminar', 'Eliminar canciones', 'Borrar canciones de Sabiá cantou.'],
        ['canciones.nossa', 'Marcar canciones como nossa', 'Cambiar la marca "nossa" al editar una canción.'],
    ];

    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('slug', 50)->unique();
            $table->string('name', 100)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('slug', 100)->unique();
            $table->string('name');
            $table->text('description')->nullable();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->char('role_id', 36);
            $table->char('permission_id', 36);
            $table->primary(['role_id', 'permission_id']);
            $table->foreign('role_id')->references('id')->on('roles')->cascadeOnDelete();
            $table->foreign('permission_id')->references('id')->on('permissions')->cascadeOnDelete();
        });

        $now = now();
        $adminId = (string) Str::uuid();
        $memberId = (string) Str::uuid();

        DB::table('roles')->insert([
            ['id' => $adminId, 'slug' => 'admin', 'name' => 'Administrador', 'description' => 'Acceso total: usuarios, roles y todo el contenido.', 'created_at' => $now, 'updated_at' => $now],
            ['id' => $memberId, 'slug' => 'member', 'name' => 'Miembro', 'description' => 'Integrante del grupo.', 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::table('permissions')->insert(array_map(fn (array $p) => [
            'id' => (string) Str::uuid(), 'slug' => $p[0], 'name' => $p[1], 'description' => $p[2],
        ], self::PERMISSIONS));

        Schema::table('usuarios', function (Blueprint $table) {
            $table->char('role_id', 36)->nullable()->after('role');
            // Un rol con personas asignadas no se puede borrar.
            $table->foreign('role_id')->references('id')->on('roles')->restrictOnDelete();
        });

        DB::table('usuarios')->where('role', 'admin')->update(['role_id' => $adminId]);
        DB::table('usuarios')->where('role', '!=', 'admin')->update(['role_id' => $memberId]);
    }

    /** La columna vieja `role` sigue al día: volver atrás no pierde datos. */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });

        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
