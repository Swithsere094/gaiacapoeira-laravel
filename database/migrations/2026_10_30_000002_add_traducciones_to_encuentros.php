<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Encuentros, fase 4: traducciones opcionales (portugués e inglés) de lo que
 * escribe el organizador. JSON `{"pt": {"campo": "…"}, "en": {…}}`; lo que
 * falta se muestra en español.
 */
return new class extends Migration
{
    private const TABLAS = ['encuentros', 'encuentro_precios', 'encuentro_actividades', 'encuentro_invitados'];

    public function up(): void
    {
        foreach (self::TABLAS as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->json('traducciones')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLAS as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->dropColumn('traducciones');
            });
        }
    }
};
