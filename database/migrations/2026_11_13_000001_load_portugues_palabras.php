<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga las 1000 palabras (database/data/portugues-palabras.php). Solo si
 * `portugues_palabras` está vacía: los cambios posteriores a la lista van en
 * migraciones nuevas, para no pisar las tarjetas de nadie.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('portugues_palabras')->exists()) {
            return;
        }

        /** @var list<array{0: int, 1: string, 2: string, 3: string, 4: list<string>, 5: string|null, 6: string|null}> $data */
        $data = require database_path('data/portugues-palabras.php');
        $now = now();

        $rows = array_map(fn (array $r) => [
            'id' => (string) Str::uuid(),
            'posicion' => $r[0],
            'palabra' => $r[1],
            'traduccion' => $r[2],
            'tipo' => $r[3],
            'formas' => json_encode($r[4], JSON_UNESCAPED_UNICODE),
            'ejemplo' => $r[5],
            'ejemplo_traduccion' => $r[6],
            'created_at' => $now,
            'updated_at' => $now,
        ], $data);

        DB::transaction(function () use ($rows) {
            foreach (array_chunk($rows, 200) as $chunk) {
                DB::table('portugues_palabras')->insert($chunk);
            }
        });
    }

    /** El contenido se borra con las tablas (create_portugues_tables). */
    public function down(): void {}
};
