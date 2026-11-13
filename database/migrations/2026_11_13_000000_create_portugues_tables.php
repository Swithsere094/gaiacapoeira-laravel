<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Portugués: asociaciones inverosímiles con las 1000 palabras más usadas.
 *
 *  - `portugues_palabras`: la lista, por orden de frecuencia (`posicion`).
 *    `formas` = las formas que se sumaron para ordenarla (é, foi, era → ser);
 *    sirven para buscar y para marcar las palabras del cancionero.
 *  - `portugues_tarjetas`: lo de cada persona con una palabra: cómo suena,
 *    su asociación o frase y el repaso espaciado (`intervalo` en días,
 *    `facilidad`, `proximo_repaso`). `saltada_at` = la saltó al trabajar
 *    un lote (no se le vuelve a proponer).
 *  - `portugues_lotes`: los lotes que cada persona marcó como avanzados.
 *
 * Las tablas viejas `portuguese_*` (del sitio anterior, sin uso) no se tocan.
 * Todo lo de cada persona se borra con ella (ON DELETE CASCADE).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portugues_palabras', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->unsignedSmallInteger('posicion')->unique();
            $table->string('palabra', 100);
            $table->string('traduccion');
            $table->string('tipo', 20);
            $table->json('formas');
            $table->text('ejemplo')->nullable();
            $table->text('ejemplo_traduccion')->nullable();
            $table->timestamps();
        });

        Schema::create('portugues_tarjetas', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->char('palabra_id', 36);
            $table->foreign('palabra_id')->references('id')->on('portugues_palabras')->cascadeOnDelete();
            $table->string('suena_como', 150)->nullable();
            $table->text('asociacion')->nullable();
            $table->text('frase')->nullable();
            $table->unsignedSmallInteger('intervalo')->default(0);
            $table->decimal('facilidad', 4, 2)->default(2.5);
            $table->unsignedSmallInteger('repeticiones')->default(0);
            $table->date('proximo_repaso')->nullable();
            $table->date('repasada_on')->nullable();
            $table->dateTime('saltada_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'palabra_id']);
        });

        Schema::create('portugues_lotes', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('user_id', 36);
            $table->foreign('user_id')->references('id')->on('usuarios')->cascadeOnDelete();
            $table->unsignedSmallInteger('lote');
            $table->timestamps();
            $table->unique(['user_id', 'lote']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portugues_lotes');
        Schema::dropIfExists('portugues_tarjetas');
        Schema::dropIfExists('portugues_palabras');
    }
};
