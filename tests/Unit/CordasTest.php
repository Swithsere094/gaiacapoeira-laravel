<?php

namespace Tests\Unit;

use App\Support\Cordas;
use PHPUnit\Framework\TestCase;

/**
 * Guarda de regresión: la lista de cordas del servidor (validación del
 * avatar) y la de la UI tienen que ser la misma, y cada corda tener su PNG.
 */
class CordasTest extends TestCase
{
    private function root(): string
    {
        return dirname(__DIR__, 2);
    }

    public function test_los_ids_coinciden_con_los_de_la_ui(): void
    {
        $ts = file_get_contents($this->root().'/resources/js/lib/constants/cordas.ts');
        preg_match_all('/\{\s*id:\s*"([^"]+)"/', $ts, $m);

        $this->assertNotEmpty($m[1]);
        $this->assertSame($m[1], Cordas::IDS);
    }

    public function test_cada_corda_tiene_su_imagen_y_no_hay_imagenes_huerfanas(): void
    {
        $dir = $this->root().'/public/Cuerda x cuerda';
        $files = array_map(fn ($f) => pathinfo($f, PATHINFO_FILENAME), glob($dir.'/*.png'));

        sort($files);
        $ids = Cordas::IDS;
        sort($ids);

        $this->assertSame($ids, $files);
    }
}
