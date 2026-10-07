<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * El índice del manual (lib/constants/manual-sections.ts) tiene que listar
 * exactamente las secciones del contenido MDX, en el mismo orden. Si se
 * agrega, renombra o reordena una <ManualSection id="..."> en el .mdx, este
 * test avisa que falta actualizar el índice.
 */
class ManualSectionsTest extends TestCase
{
    public function test_el_indice_coincide_con_las_secciones_del_mdx(): void
    {
        $root = dirname(__DIR__, 2).'/resources/js';

        preg_match_all('/<ManualSection id="([^"]+)">/', file_get_contents($root.'/content/politica/manual-convivencia.mdx'), $mdx);
        preg_match_all('/\{\s*id:\s*"([^"]+)"/', file_get_contents($root.'/lib/constants/manual-sections.ts'), $toc);

        $this->assertNotEmpty($mdx[1]);
        $this->assertSame($mdx[1], $toc[1]);
    }
}
