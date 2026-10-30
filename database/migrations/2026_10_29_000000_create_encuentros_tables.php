<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Encuentros: eventos del grupo (batizados…) con página pública en su
 * subdominio e inscripción sin cuenta. No confundir con `eventos`
 * (calendario): un encuentro publicado se copia ahí (`evento_id`).
 *
 * También agrega el permiso `encuentros.gestionar` (ningún rol lo recibe:
 * por ahora solo admins, decisión del usuario 2026-10-29).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('encuentros', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->string('slug', 63)->unique();
            $table->string('nombre');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->string('lugar')->nullable();
            $table->string('mapa_url', 500)->nullable();
            $table->text('descripcion')->nullable();
            // Lo que escribe el organizador: cuentas, a quién mandar el comprobante…
            $table->text('info_pago')->nullable();
            $table->string('portada_url')->nullable();
            $table->unsignedInteger('cupo')->nullable();
            $table->date('inscripciones_desde')->nullable();
            $table->date('inscripciones_hasta')->nullable();
            $table->enum('estado', ['borrador', 'publicado', 'cerrado', 'terminado'])->default('borrador');
            // Subdominio en Hostinger: se crea al publicar por primera vez.
            $table->enum('subdominio', ['ninguno', 'creado', 'error'])->default('ninguno');
            $table->json('respuesta_api')->nullable();
            // Copia en el calendario mientras está publicado.
            $table->char('evento_id', 36)->nullable();
            $table->foreign('evento_id')->references('id')->on('eventos')->nullOnDelete();
            $table->char('user_id', 36)->nullable();
            $table->foreign('user_id')->references('id')->on('usuarios')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('encuentro_precios', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('descripcion')->nullable();
            // Pesos colombianos, sin decimales.
            $table->unsignedInteger('valor');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('inscripciones', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            // Para la captura de la confirmación y para buscar en el panel.
            $table->string('codigo', 9)->unique();
            // Enlace privado para volver a consultar la inscripción.
            $table->string('token', 64)->unique();
            $table->string('nombre');
            $table->string('apelido')->nullable();
            $table->string('grupo');
            $table->string('profesor')->nullable();
            $table->string('graduacion')->nullable();
            $table->string('ciudad');
            $table->string('telefono', 30);
            $table->string('email')->nullable();
            $table->string('talla', 10)->nullable();
            $table->string('emergencia_nombre');
            $table->string('emergencia_telefono', 30);
            // La opción elegida, con nombre y valor copiados: si el organizador
            // la cambia o la borra después, la inscripción conserva lo que eligió.
            $table->char('precio_id', 36)->nullable();
            $table->foreign('precio_id')->references('id')->on('encuentro_precios')->nullOnDelete();
            $table->string('precio_nombre');
            $table->unsignedInteger('precio_valor');
            $table->enum('pago_estado', ['pendiente', 'parcial', 'pagado'])->default('pendiente');
            $table->unsignedInteger('monto_pagado')->default(0);
            $table->enum('estado', ['activa', 'cancelada'])->default('activa');
            $table->text('notas')->nullable();
            // Autorización de datos personales (Ley 1581): cuándo la aceptó.
            $table->timestamp('consentimiento_at');
            $table->string('locale', 5)->default('es');
            $table->timestamps();
            $table->index(['encuentro_id', 'estado']);
        });

        DB::table('permissions')->insert([
            'id' => (string) Str::uuid(),
            'slug' => 'encuentros.gestionar',
            'name' => 'Gestionar encuentros',
            'description' => 'Crear y publicar encuentros (batizados…) con su página de inscripción, y gestionar las inscripciones y los pagos.',
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('inscripciones');
        Schema::dropIfExists('encuentro_precios');
        Schema::dropIfExists('encuentros');
        DB::table('permissions')->where('slug', 'encuentros.gestionar')->delete();
    }
};
