<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Encuentros, fase 3: programación por día, invitados con foto y la
 * dirección para el mapa de la página pública.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('encuentros', function (Blueprint $table) {
            // Lo que se busca en Google Maps para el mapa embebido.
            $table->string('direccion', 200)->nullable()->after('lugar');
        });

        Schema::create('encuentro_actividades', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            $table->date('fecha');
            // Sin hora: actividad del día sin horario fijo.
            $table->time('hora_inicio')->nullable();
            $table->time('hora_fin')->nullable();
            $table->string('titulo', 150);
            $table->string('descripcion', 300)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('encuentro_invitados', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            $table->string('nombre', 120);
            // Título o graduación: Mestre, Contramestre, Professora…
            $table->string('titulo', 60)->nullable();
            $table->string('grupo', 120)->nullable();
            $table->string('ciudad', 80)->nullable();
            $table->text('bio')->nullable();
            $table->string('foto_url')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encuentro_invitados');
        Schema::dropIfExists('encuentro_actividades');
        Schema::table('encuentros', function (Blueprint $table) {
            $table->dropColumn('direccion');
        });
    }
};
