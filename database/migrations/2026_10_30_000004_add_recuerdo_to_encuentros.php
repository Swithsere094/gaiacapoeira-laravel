<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Encuentros, fase 5 (después del encuentro): mensaje de cierre, galería de
 * fotos y el estado `archivado` (sin página: se borró el subdominio, los
 * datos quedan).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE encuentros MODIFY estado ENUM('borrador', 'publicado', 'cerrado', 'terminado', 'archivado') NOT NULL DEFAULT 'borrador'");

        Schema::table('encuentros', function (Blueprint $table) {
            $table->text('mensaje_final')->nullable()->after('info_pago');
        });

        Schema::create('encuentro_fotos', function (Blueprint $table) {
            $table->char('id', 36)->primary();
            $table->char('encuentro_id', 36);
            $table->foreign('encuentro_id')->references('id')->on('encuentros')->cascadeOnDelete();
            // Reducida (máx. 2000 px) y miniatura (máx. 480 px) para la galería.
            $table->string('foto_url');
            $table->string('miniatura_url');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('encuentro_fotos');
        Schema::table('encuentros', function (Blueprint $table) {
            $table->dropColumn('mensaje_final');
        });
        DB::table('encuentros')->where('estado', 'archivado')->update(['estado' => 'terminado']);
        DB::statement("ALTER TABLE encuentros MODIFY estado ENUM('borrador', 'publicado', 'cerrado', 'terminado') NOT NULL DEFAULT 'borrador'");
    }
};
