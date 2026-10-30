<?php

namespace App\Models\Concerns;

use App\Support\EncuentroIdioma;

/**
 * Modelos de encuentros con traducciones opcionales en la columna JSON
 * `traducciones` (`{"pt": {"campo": "…"}, "en": {…}}`). El español es el
 * texto original de cada columna.
 *
 * @property array<string, array<string, string>>|null $traducciones
 */
trait Traducible
{
    public function initializeTraducible(): void
    {
        $this->mergeCasts(['traducciones' => 'array']);
        $this->mergeFillable(['traducciones']);
    }

    /** El campo en `$locale`, o el original en español si no está traducido. */
    public function traducido(string $campo, string $locale): ?string
    {
        $original = $this->getAttribute($campo);
        $traduccion = $locale === EncuentroIdioma::ORIGINAL ? null : ($this->traducciones[$locale][$campo] ?? null);

        return is_string($traduccion) && $traduccion !== '' ? $traduccion : (is_string($original) ? $original : null);
    }
}
