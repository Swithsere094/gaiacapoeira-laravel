<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Encuentros, fase 6: contabilidad. Gastos y otros ingresos que anota el
 * organizador (los pagos de las inscripciones ya están en
 * `inscripcion_pagos` y se suman solos).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encuentro_movimientos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            $table->enum('tipo', ['ingreso', 'gasto']);
            $table->date('fecha');
            $table->string('concepto', 150);
            $table->string('categoria', 40);
            // Pesos colombianos, sin decimales.
            $table->unsignedInteger('monto');
            $table->string('metodo', 40)->nullable();
            $table->string('comprobante_url')->nullable();
            $table->string('nota', 300)->nullable();
            // Quién lo anotó.
            $table->char('user_id', 36)->nullable();
            $table->foreign('user_id')->references('id')->on('usuarios')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encuentro_movimientos');
    }
};
