<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Carga los árboles provisorios del demo de retos
 * (database/data/arbol-provisional.php). Solo si `habilidades` está vacía:
 * si ya hay contenido (cargado o editado por los admins), no toca nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('habilidades')->exists()) {
            return;
        }

        /** @var array{movimiento: array<string, array{0: string, 1: list<string>, 2: int, 3: string, 4: array{0: string, 1: string, 2: list<array{0: string, 1: int, 2: string}>}, 5: array{0: string, 1: string, 2: list<array{0: string, 1: int, 2: string}>}}>, musicalidad: array<string, array{0: string, 1: list<string>, 2: int, 3: string, 4: array{0: string, 1: string, 2: list<array{0: string, 1: int, 2: string}>}, 5: array{0: string, 1: string, 2: list<array{0: string, 1: int, 2: string}>}}>, sueltos: list<array{0: string, 1: string, 2: string, 3: list<array{0: string, 1: int, 2: string}>}>, wrap: array<string, array{0: list<array{0: string, 1: int, 2: string}>, 1: list<array{0: string, 1: int, 2: string}>}>} $data */
        $data = require database_path('data/arbol-provisional.php');
        $now = now();

        DB::transaction(function () use ($data, $now) {
            $ids = [];
            $requisitos = [];
            $retos = [];

            foreach (['movimiento', 'musicalidad'] as $tree) {
                [$intro, $outro] = $data['wrap'][$tree];
                $order = 0;

                foreach ($data[$tree] as $slug => [$name, $requires, $secretWeeks, $description, $practica, $secreto]) {
                    $id = (string) Str::uuid();
                    $ids[$slug] = $id;

                    DB::table('habilidades')->insert([
                        'id' => $id, 'tree' => $tree, 'slug' => $slug, 'name' => $name,
                        'description' => $description, 'video_url' => null,
                        'secret_weeks' => $secretWeeks, 'sort_order' => $order++,
                        'created_at' => $now, 'updated_at' => $now,
                    ]);

                    foreach ($requires as $required) {
                        $requisitos[] = ['habilidad_id' => $id, 'requisito_id' => $required];
                    }

                    $retos[] = $this->reto($id, 'practica', null, $practica[0], $practica[1], array_merge($intro, $practica[2], $outro), 0, $now);
                    $retos[] = $this->reto($id, 'secreto', null, $secreto[0], $secreto[1], array_merge($intro, $secreto[2], $outro), 1, $now);
                }
            }

            foreach ($requisitos as $row) {
                $row['requisito_id'] = $ids[$row['requisito_id']];
                DB::table('habilidad_requisitos')->insert($row);
            }

            foreach ($data['sueltos'] as $i => [$category, $title, $description, $steps]) {
                $retos[] = $this->reto(null, 'suelto', $category, $title, $description, $steps, $i, $now);
            }

            DB::table('retos')->insert($retos);
        });
    }

    /**
     * @param  list<array{0: string, 1: int, 2: string}>  $steps
     * @return array<string, mixed>
     */
    private function reto(?string $habilidadId, string $kind, ?string $category, string $title, string $description, array $steps, int $order, mixed $now): array
    {
        return [
            'id' => (string) Str::uuid(),
            'habilidad_id' => $habilidadId,
            'kind' => $kind,
            'category' => $category,
            'title' => $title,
            'description' => $description,
            'steps' => json_encode(array_map(
                fn (array $s) => ['title' => $s[0], 'seconds' => $s[1], 'detail' => $s[2]],
                $steps,
            ), JSON_UNESCAPED_UNICODE),
            'sort_order' => $order,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /** El contenido se borra con las tablas (create_retos_tables). */
    public function down(): void {}
};
