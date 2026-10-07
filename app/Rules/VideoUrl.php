<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Solo URLs de YouTube o Vimeo (http/https).
 *
 * Los videos se muestran embebidos (iframe) dentro del sitio para todos los
 * usuarios, y cualquier miembro puede cargar canciones: sin esta regla se
 * podría embeber una página externa cualquiera (ej. un formulario falso)
 * dentro de Sabiá cantou. Se valida por dominio exacto, no por texto.
 */
class VideoUrl implements ValidationRule
{
    private const HOSTS = [
        'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
        'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $scheme = is_string($value) ? strtolower((string) parse_url($value, PHP_URL_SCHEME)) : '';
        $host = is_string($value) ? strtolower((string) parse_url($value, PHP_URL_HOST)) : '';

        if (! in_array($scheme, ['http', 'https'], true) || ! in_array($host, self::HOSTS, true)) {
            $fail('El video tiene que ser un enlace de YouTube o Vimeo.');
        }
    }
}
