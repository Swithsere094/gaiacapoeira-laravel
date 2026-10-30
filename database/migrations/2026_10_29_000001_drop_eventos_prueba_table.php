<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La prueba de concepto de subdominios (eventos_prueba) ya se validó y la
 * reemplazan los encuentros. En producción la tabla está vacía ("Prueba Uno"
 * se creó y se eliminó el 2026-10-28).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('eventos_prueba');
    }

    public function down(): void
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
};
