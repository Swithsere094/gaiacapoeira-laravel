<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Retos y árbol de habilidades (demo, solo admins).
 *
 *  - `habilidades`: nodos de los dos árboles (movimiento y musicalidad).
 *    `secret_weeks` = semanas válidas que hacen aparecer su reto secreto.
 *  - `habilidad_requisitos`: de qué habilidades depende cada una (hay que
 *    dominarlas todas para desbloquearla).
 *  - `retos`: de práctica (de una habilidad, semanales), secreto (uno por
 *    habilidad, libre) o suelto (sin habilidad, semanales). `steps` es la
 *    rutina guiada: lista de {title, detail, seconds}.
 *  - `reto_semanas`: cada vez que alguien acepta un reto semanal (7 días).
 *    La medalla no se guarda: sale de los días con entrenamiento.
 *  - `entrenamientos`: cada sesión guiada. `completed_on` es el día (hora
 *    de Colombia) en que se completó.
 *  - `habilidades_dominadas`: por revisión aprobada o marcada a mano.
 *  - `revisiones`: pedidos de revisión del reto secreto.
 *
 * Todo lo de cada persona se borra con ella (ON DELETE CASCADE).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habilidades', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('tree', 20);
            $table->string('slug', 80)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('video_url')->nullable();
            $table->unsignedTinyInteger('secret_weeks')->default(3);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['tree', 'sort_order']);
        });

        Schema::create('habilidad_requisitos', function (Blueprint $table) {
            $table->char('habilidad_id', 36);
            $table->char('requisito_id', 36);
            $table->primary(['habilidad_id', 'requisito_id']);
            $table->foreign('habilidad_id')->references('id')->on('habilidades')->cascadeOnDelete();
            $table->foreign('requisito_id')->references('id')->on('habilidades')->cascadeOnDelete();
        });

        Schema::create('retos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('habilidad_id', 36)->nullable();
            $table->foreign('habilidad_id')->references('id')->on('habilidades')->cascadeOnDelete();
            $table->string('kind', 20);
            $table->string('category', 30)->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('steps');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['habilidad_id', 'kind']);
        });

        Schema::create('reto_semanas', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->char('reto_id', 36);
            $table->foreign('reto_id')->references('id')->on('retos')->cascadeOnDelete();
            $table->date('starts_on');
            $table->date('ends_on');
            $table->dateTime('abandoned_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'ends_on']);
        });

        Schema::create('entrenamientos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->char('reto_id', 36);
            $table->foreign('reto_id')->references('id')->on('retos')->cascadeOnDelete();
            $table->char('reto_semana_id', 36)->nullable();
            $table->foreign('reto_semana_id')->references('id')->on('reto_semanas')->cascadeOnDelete();
            $table->unsignedInteger('duration_seconds');
            $table->dateTime('started_at');
            $table->dateTime('completed_at')->nullable();
            $table->date('completed_on')->nullable();
            $table->timestamps();
            $table->index(['reto_semana_id', 'completed_on']);
            $table->index(['user_id', 'reto_id']);
        });

        Schema::create('habilidades_dominadas', function (Blueprint $table) {
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->char('habilidad_id', 36);
            $table->foreign('habilidad_id')->references('id')->on('habilidades')->cascadeOnDelete();
            $table->primary(['user_id', 'habilidad_id']);
            $table->string('source', 20);
            $table->char('granted_by', 36)->nullable();
            $table->foreign('granted_by')->references('id')->on('usuarios')->nullOnDelete();
            $table->dateTime('created_at');
        });

        Schema::create('revisiones', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->char('habilidad_id', 36);
            $table->foreign('habilidad_id')->references('id')->on('habilidades')->cascadeOnDelete();
            $table->string('status', 20)->default('pendiente');
            $table->text('comment')->nullable();
            $table->char('reviewer_id', 36)->nullable();
            $table->foreign('reviewer_id')->references('id')->on('usuarios')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revisiones');
        Schema::dropIfExists('habilidades_dominadas');
        Schema::dropIfExists('entrenamientos');
        Schema::dropIfExists('reto_semanas');
        Schema::dropIfExists('retos');
        Schema::dropIfExists('habilidad_requisitos');
        Schema::dropIfExists('habilidades');
    }
};
