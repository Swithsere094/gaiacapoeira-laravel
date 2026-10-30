<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Encuentros, fase 2: historial de pagos de cada inscripción (con
 * comprobante opcional) y asistencia el día del encuentro.
 *
 * Un pago lo reporta quien se inscribe (queda "reportado" hasta que un
 * organizador lo confirma o lo rechaza) o lo registra un organizador (queda
 * "confirmado"). `inscripciones.monto_pagado` y `pago_estado` pasan a ser la
 * suma de los confirmados (Inscripcion::recalcularPago). Lo marcado a mano
 * en la fase 1 se convierte en un pago confirmado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inscripcion_pagos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('inscripcion_id', 36);
            $table->foreign('inscripcion_id')->references('id')->on('inscripciones')->cascadeOnDelete();
            $table->unsignedInteger('monto');
            $table->date('fecha');
            $table->string('metodo', 40)->nullable();
            // Carpeta privada (no la entrega /uploads/): solo la ven los organizadores.
            $table->string('comprobante_url')->nullable();
            $table->string('nota', 300)->nullable();
            $table->enum('estado', ['reportado', 'confirmado', 'rechazado'])->default('confirmado');
            $table->enum('origen', ['participante', 'organizador']);
            // Quién lo registró o lo revisó.
            $table->char('user_id', 36)->nullable();
            $table->foreign('user_id')->references('id')->on('usuarios')->nullOnDelete();
            $table->timestamps();
            $table->index(['inscripcion_id', 'estado']);
        });

        Schema::table('inscripciones', function (Blueprint $table) {
            $table->timestamp('asistio_at')->nullable()->after('estado');
        });

        $now = now();
        foreach (DB::table('inscripciones')->where('monto_pagado', '>', 0)->get(['id', 'monto_pagado', 'updated_at']) as $i) {
            DB::table('inscripcion_pagos')->insert([
                'id' => (string) Str::uuid(),
                'inscripcion_id' => $i->id,
                'monto' => $i->monto_pagado,
                'fecha' => substr((string) $i->updated_at, 0, 10),
                'nota' => 'Marcado a mano antes del historial de pagos',
                'estado' => 'confirmado',
                'origen' => 'organizador',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            $table->dropColumn('asistio_at');
        });
        Schema::dropIfExists('inscripcion_pagos');
    }
};
