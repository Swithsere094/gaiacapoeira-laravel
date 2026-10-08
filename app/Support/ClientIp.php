<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * IP del visitante para los límites de intentos (login).
 *
 * Hostinger sirve el sitio detrás de su CDN/proxy: la IP de la conexión
 * (REMOTE_ADDR) es la del proxy, igual para todos. Sin esto, el límite de
 * 10 intentos de login por IP sería global (10 errores de cualquiera
 * bloquearían el login de todos).
 *
 * Se toma la ÚLTIMA IP de X-Forwarded-For: es la que agregó el proxy y el
 * visitante no la controla. (Las primeras las puede inventar el visitante;
 * por eso NO se usa trustProxies('*') de Laravel, que devuelve la primera.)
 * Sin la cabecera (acceso directo, local, tests) se usa REMOTE_ADDR.
 *
 * Verificado en Hostinger (2026-10-08, nuevo.gaiacapoeira.com): el proxy
 * agrega la IP real al final; una IP inventada por el visitante queda
 * primera ("6.6.6.6, <IP real>").
 */
final class ClientIp
{
    public static function for(Request $request): string
    {
        $forwarded = (string) $request->headers->get('X-Forwarded-For', '');

        if ($forwarded !== '') {
            $parts = explode(',', $forwarded);
            $last = trim($parts[count($parts) - 1]);

            if (filter_var($last, FILTER_VALIDATE_IP)) {
                return $last;
            }
        }

        $remote = $request->server->get('REMOTE_ADDR');

        return is_string($remote) && $remote !== '' ? $remote : '0.0.0.0';
    }
}
