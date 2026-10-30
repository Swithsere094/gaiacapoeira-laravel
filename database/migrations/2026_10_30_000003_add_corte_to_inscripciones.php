<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Corte de la camiseta (masculino / femenino) junto a la talla: a veces se
 * elige un corte distinto al esperado, y el pedido se arma por corte y talla.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            $table->string('corte', 20)->nullable()->after('talla');
        });
    }

    public function down(): void
    {
        Schema::table('inscripciones', function (Blueprint $table) {
            $table->dropColumn('corte');
        });
    }
};
