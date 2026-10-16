<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Calendario de eventos (fase 9).
 *
 * Fechas y horas se guardan tal cual, en hora de Colombia (sin pasar a UTC):
 * Colombia no tiene horario de verano, así que no hay conversiones.
 *
 * Un evento es de un día (solo `starts_on`), de varios días seguidos
 * (`starts_on` → `ends_on`) o recurrente (`repeat_days`: días ISO 1 = lunes
 * … 7 = domingo, entre `starts_on` y `ends_on`). Sin horas = todo el día.
 * Las repeticiones no se guardan: se calculan (App\Support\EventCalendar).
 *
 * También agrega el permiso `eventos.gestionar` y el rol Profesor con ese
 * permiso (decisión del usuario, 2026-10-15).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->json('repeat_days')->nullable();
            // Contenido curado: si se elimina a quien lo creó, el evento
            // queda (y solo un admin lo puede editar).
            $table->char('user_id', 36)->nullable();
            $table->foreign('user_id')->references('id')->on('usuarios')->nullOnDelete();
            $table->timestamps();
            $table->index(['starts_on', 'ends_on']);
        });

        $permissionId = (string) Str::uuid();
        DB::table('permissions')->insert([
            'id' => $permissionId,
            'slug' => 'eventos.gestionar',
            'name' => 'Crear eventos',
            'description' => 'Crear eventos en el calendario, y editar y eliminar los propios.',
        ]);

        // Si ya existe un rol con ese nombre (creado a mano), solo recibe el permiso.
        $roleId = DB::table('roles')->where('slug', 'profesor')->orWhere('name', 'Profesor')->value('id');
        if (! $roleId) {
            $roleId = (string) Str::uuid();
            DB::table('roles')->insert([
                'id' => $roleId, 'slug' => 'profesor', 'name' => 'Profesor',
                'description' => 'Organiza clases y eventos del grupo.',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        DB::table('permission_role')->insert(['role_id' => $roleId, 'permission_id' => $permissionId]);
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
        // El rol Profesor queda (puede tener personas asignadas).
        DB::table('permissions')->where('slug', 'eventos.gestionar')->delete();
    }
};
