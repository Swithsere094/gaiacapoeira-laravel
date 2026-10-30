<?php

namespace App\Support;

use App\Models\Encuentro;
use App\Models\Evento;

/**
 * Copia de un encuentro en el calendario del sitio (`eventos`): existe
 * mientras el encuentro está publicado o cerrado, con su nombre, fechas,
 * lugar y el enlace a la página. Si alguien la edita desde el calendario,
 * se vuelve a pisar con los datos del encuentro al siguiente cambio.
 */
final class EncuentroCalendario
{
    public static function sync(Encuentro $encuentro): void
    {
        if (! in_array($encuentro->estado, [Encuentro::PUBLICADO, Encuentro::CERRADO], true)) {
            self::remove($encuentro);

            return;
        }

        $data = [
            'title' => $encuentro->nombre,
            'description' => 'Página e inscripciones: '.$encuentro->url(),
            'location' => $encuentro->lugar,
            'starts_on' => $encuentro->starts_on->toDateString(),
            'ends_on' => $encuentro->ends_on?->toDateString(),
            'start_time' => null,
            'end_time' => null,
            'repeat_days' => null,
        ];

        $evento = $encuentro->evento;

        if ($evento) {
            $evento->update($data);
        } else {
            $evento = Evento::create([...$data, 'user_id' => $encuentro->user_id]);
            $encuentro->forceFill(['evento_id' => $evento->id])->save();
        }
    }

    public static function remove(Encuentro $encuentro): void
    {
        if ($encuentro->evento_id) {
            Evento::whereKey($encuentro->evento_id)->delete();
            $encuentro->forceFill(['evento_id' => null])->save();
        }
    }
}
