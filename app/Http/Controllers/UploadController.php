<?php

namespace App\Http\Controllers;

use App\Support\Uploads;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Entrega un archivo subido (`/uploads/...`) solo a usuarios con sesión.
 * Ver App\Support\Uploads sobre por qué no se sirven desde public/.
 */
class UploadController extends Controller
{
    public function show(string $path): BinaryFileResponse
    {
        $file = Uploads::pathFor('/uploads/'.$path);

        // Carpetas privadas (comprobantes de pago): no las entrega esta ruta
        // general, solo sus rutas propias con permiso.
        abort_if($file === null || Uploads::isPrivate($file), 404);

        return response()->file($file, [
            // Que el navegador no "adivine" otro tipo de contenido.
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
