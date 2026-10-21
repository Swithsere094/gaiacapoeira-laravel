<?php

namespace Tests\Unit;

use App\Models\Reto;
use PHPUnit\Framework\TestCase;

/**
 * Los íconos que guarda la base (habilidades) y las categorías de retos
 * sueltos tienen que existir en resources/js/lib/icons.ts; si no, el sitio
 * muestra el genérico sin avisar.
 */
class IconsTest extends TestCase
{
    /** @return list<string> claves de un `Record<string, LucideIcon>` de icons.ts */
    private function keysOf(string $constant): array
    {
        $source = (string) file_get_contents(dirname(__DIR__, 2).'/resources/js/lib/icons.ts');
        preg_match('/export const '.$constant.'[^{]*\{(.*?)\n\};/s', $source, $block);
        preg_match_all("/^\\s*'?([a-z0-9-]+)'?:\\s*[A-Z]\\w*,/m", $block[1] ?? '', $keys);

        return $keys[1];
    }

    /** @return array<string, string> slug => ícono, de la migración */
    private function migrationIcons(): array
    {
        $migration = require dirname(__DIR__, 2).'/database/migrations/2026_10_21_000000_add_icon_to_habilidades.php';

        return $migration::ICONS;
    }

    public function test_los_iconos_de_las_habilidades_existen_en_el_navegador(): void
    {
        $known = $this->keysOf('SKILL_ICONS');
        $this->assertNotEmpty($known);

        foreach ($this->migrationIcons() as $slug => $icon) {
            $this->assertContains($icon, $known, "Ícono «{$icon}» de {$slug}");
        }
    }

    public function test_cada_categoria_de_reto_suelto_tiene_icono(): void
    {
        $this->assertEqualsCanonicalizing(Reto::CATEGORIES, $this->keysOf('CATEGORY_ICONS'));
    }

    public function test_cada_habilidad_del_contenido_provisorio_tiene_icono(): void
    {
        $data = require dirname(__DIR__, 2).'/database/data/arbol-provisional.php';
        $slugs = [...array_keys($data['movimiento']), ...array_keys($data['musicalidad'])];

        $this->assertEqualsCanonicalizing($slugs, array_keys($this->migrationIcons()));
    }
}
