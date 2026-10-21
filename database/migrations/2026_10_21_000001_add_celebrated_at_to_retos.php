<?php

use App\Support\EventCalendar;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cuándo se le mostró a la persona la celebración de un logro, para que
 * aparezca una sola vez (App\Support\Celebraciones):
 *
 *  - `reto_semanas.celebrated_at`: la medalla de una semana terminada;
 *  - `revisiones.celebrated_at`: la aprobación de una revisión.
 *
 * Lo que ya pasó se marca como celebrado (semanas ya terminadas, revisiones
 * ya respondidas): nadie recibe de golpe las celebraciones de logros viejos.
 * Las semanas en curso quedan sin marcar, para celebrarlas al terminar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reto_semanas', function (Blueprint $table) {
            $table->dateTime('celebrated_at')->nullable()->after('abandoned_at');
        });

        Schema::table('revisiones', function (Blueprint $table) {
            $table->dateTime('celebrated_at')->nullable()->after('reviewed_at');
        });

        $now = now();
        DB::table('reto_semanas')
            ->where('ends_on', '<', EventCalendar::today()->toDateString())
            ->update(['celebrated_at' => $now]);
        DB::table('revisiones')->where('status', '!=', 'pendiente')->update(['celebrated_at' => $now]);
    }

    public function down(): void
    {
        Schema::table('reto_semanas', function (Blueprint $table) {
            $table->dropColumn('celebrated_at');
        });

        Schema::table('revisiones', function (Blueprint $table) {
            $table->dropColumn('celebrated_at');
        });
    }
};
