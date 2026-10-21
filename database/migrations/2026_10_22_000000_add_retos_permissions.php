<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Permisos de los retos, para liberarlos por partes (decisión del usuario,
 * 2026-10-20): primero Entrenar para todos; el árbol y las revisiones, más
 * adelante. Ningún rol los recibe acá: se asignan desde Gestión de Roles
 * (el admin los tiene siempre).
 */
return new class extends Migration
{
    private const PERMISSIONS = [
        'retos.entrenar' => ['Retos: Entrenar', 'Hacer los retos de Entrenar (flexibilidad, fuerza, resistencia…) y ganar sus medallas.'],
        'retos.arbol' => ['Retos: Árbol de habilidades', 'Ver su árbol de habilidades, hacer los retos de cada habilidad y pedir revisiones.'],
        'retos.revisar' => ['Retos: Revisiones y personas', 'Aprobar o rechazar revisiones y marcar habilidades a mano a otras personas (nunca en su propio árbol).'],
    ];

    public function up(): void
    {
        foreach (self::PERMISSIONS as $slug => [$name, $description]) {
            DB::table('permissions')->insert([
                'id' => (string) Str::uuid(),
                'slug' => $slug,
                'name' => $name,
                'description' => $description,
            ]);
        }
    }

    public function down(): void
    {
        // Borra también sus filas en permission_role (ON DELETE CASCADE).
        DB::table('permissions')->whereIn('slug', array_keys(self::PERMISSIONS))->delete();
    }
};
