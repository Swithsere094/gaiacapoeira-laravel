<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Prueba de concepto de subdominios por evento ({slug}.gaiacapoeira.com),
 * creados con la API de Hostinger desde /admin/eventos-prueba. Aparte de la
 * tabla `eventos` (calendario): esta es solo para validar el flujo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos_prueba', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('nombre');
            $table->string('slug', 63)->unique();
            $table->enum('estado', ['pendiente', 'creado', 'error'])->default('pendiente');
            $table->json('respuesta_api')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_prueba');
    }
};
