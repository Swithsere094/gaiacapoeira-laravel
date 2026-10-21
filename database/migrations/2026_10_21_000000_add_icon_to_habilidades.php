<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ícono de cada habilidad (se ve cuando está desbloqueada; dominada muestra
 * ✓ y bloqueada 🔒). Es el nombre de un ícono de la lista fija del sitio
 * (resources/js/lib/icons.ts); sin ícono, se usa uno genérico.
 *
 * Asigna los íconos a las habilidades del contenido provisorio, solo a las
 * que todavía no tienen (no pisa uno elegido a mano).
 */
return new class extends Migration
{
    /** slug => ícono */
    public const ICONS = [
        // Movimiento
        'ginga' => 'footprints',
        'esquiva' => 'move-horizontal',
        'negativa' => 'arrow-down-to-line',
        'cocorinha' => 'shield',
        'guarda-baixa' => 'shield-half',
        'meia-lua-de-frente' => 'moon',
        'au' => 'rotate-cw',
        'role' => 'refresh-ccw',
        'armada' => 'rotate-ccw',
        'queixada' => 'redo-2',
        'rasteira' => 'brush',
        'bananeira' => 'person-standing',
        'queda-de-quatro' => 'layout-grid',
        'meia-lua-de-compasso' => 'compass',
        'queda-de-rins' => 'scale',
        'macaco' => 'paw-print',
        'armada-pulada' => 'tornado',
        'au-sem-mao' => 'feather',
        'au-batido' => 'zap',
        'parafuso' => 'drill',
        // Musicalidad
        'palmas' => 'hand',
        'coro' => 'users',
        'pandeiro' => 'disc-3',
        'agogo-reco' => 'bell',
        'berimbau-sonidos' => 'audio-lines',
        'corridos' => 'mic-vocal',
        'toque-angola' => 'music-2',
        'atabaque' => 'drum',
        'sao-bento-pequeno' => 'music-3',
        'quadras' => 'list-music',
        'puxar-corridos' => 'megaphone',
        'sao-bento-grande' => 'music-4',
        'ladainha' => 'book-open',
        'variacoes-berimbau' => 'shuffle',
        'tocar-e-cantar' => 'mic',
        'comandar-roda' => 'crown',
    ];

    public function up(): void
    {
        Schema::table('habilidades', function (Blueprint $table) {
            $table->string('icon', 40)->nullable()->after('name');
        });

        foreach (self::ICONS as $slug => $icon) {
            DB::table('habilidades')->where('slug', $slug)->whereNull('icon')->update(['icon' => $icon]);
        }
    }

    public function down(): void
    {
        Schema::table('habilidades', function (Blueprint $table) {
            $table->dropColumn('icon');
        });
    }
};
