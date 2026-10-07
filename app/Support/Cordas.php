<?php

namespace App\Support;

/**
 * IDs válidos de cordas (graduaciones), para validar el avatar del perfil.
 *
 * La fuente de verdad de la UI (etiquetas y grupos) es
 * resources/js/lib/constants/cordas.ts; esta lista debe tener exactamente
 * los mismos IDs, y cada uno su PNG en public/Cuerda x cuerda/. Lo verifica
 * tests/Unit/CordasTest.php.
 */
final class Cordas
{
    public const IDS = [
        'batizado', 'Mirim1', 'Mirim2', 'Mirim3', 'Mirim4', 'Mirim5', 'mirim6', 'Mirim7',
        'aluno_iniciante_1', 'aluno_iniciante_2', 'aluno_confirmado_1', 'aluno_confirmado_2',
        'graduado', 'monitor_1', 'Monitor_2', 'instruror_1', 'instrutor_2',
        'professor_1', 'professor_2', 'contramestre_1', 'contramestre_2',
        'mestre', 'grao_mestre', 'estagiario',
    ];
}
