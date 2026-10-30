<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ArbolController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\EncuentroController;
use App\Http\Controllers\EncuentroPublicoController;
use App\Http\Controllers\EventoController;
use App\Http\Controllers\GaleraController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InscripcionController;
use App\Http\Controllers\PersonaController;
use App\Http\Controllers\PoliticaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RetoController;
use App\Http\Controllers\RetoDemoController;
use App\Http\Controllers\RevisionController;
use App\Http\Controllers\SongController;
use App\Http\Controllers\UploadController;
use App\Http\Middleware\ResolveEncuentro;
use App\Models\Encuentro;
use App\Support\Permissions;
use Illuminate\Support\Facades\Route;

// ── Encuentros: páginas públicas (sin sesión) ────────────────────────
// En el subdominio ({slug}.gaiacapoeira.com) y, de respaldo, en /e/{slug}
// (también sirve para previsualizar un borrador con sesión). El grupo por
// subdominio va ANTES que el resto: las demás rutas no tienen dominio y
// atienden cualquier host. El patrón deja afuera los subdominios
// reservados (www, mail…), que siguen yendo al sitio principal.
$encuentroPublico = function () {
    Route::get('/', [EncuentroPublicoController::class, 'show'])->name('pagina');
    Route::post('inscripcion', [EncuentroPublicoController::class, 'store'])->name('inscribir');
    Route::get('inscripcion/{token}', [EncuentroPublicoController::class, 'consulta'])->where('token', '[A-Za-z0-9]{20,64}')->name('consulta');
    Route::get('portada', [EncuentroPublicoController::class, 'portada'])->name('portada');
};

Route::domain('{encuentro}.'.config('services.hostinger.domain'))
    ->where(['encuentro' => '(?!(?:'.implode('|', Encuentro::RESERVADOS).')\.)[a-z0-9-]{3,63}'])
    ->middleware(ResolveEncuentro::class)
    ->name('encuentro.subdominio.')
    ->group($encuentroPublico);

Route::prefix('e/{encuentro}')
    ->where(['encuentro' => '[a-z0-9-]{3,63}'])
    ->middleware(ResolveEncuentro::class)
    ->name('encuentro.respaldo.')
    ->group($encuentroPublico);

// ── Público (sin sesión) ─────────────────────────────────────────────
Route::middleware('guest')->prefix('auth')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
});

// "Olvidé mi contraseña" ya no existe (lo resuelve un admin): la dirección
// vieja lleva al login, que explica qué hacer.
Route::get('auth/olvide-contrasena', fn () => redirect('/auth/login'));

// ── Todo lo demás requiere sesión ────────────────────────────────────
Route::middleware('auth')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout'])->name('logout');

    // Inicio: tarjetas de secciones y calendario del mes (?fecha=Y-m-d).
    Route::get('/', HomeController::class)->name('home');

    // Eventos: cualquiera ve (?vista=mes|semana&fecha=Y-m-d); crear, editar
    // y eliminar lo decide EventoPolicy (permiso + solo los propios).
    Route::get('eventos', [EventoController::class, 'index'])->name('eventos');
    Route::post('eventos', [EventoController::class, 'store']);
    Route::put('eventos/{evento}', [EventoController::class, 'update']);
    Route::delete('eventos/{evento}', [EventoController::class, 'destroy']);

    // Mi perfil: cada usuario edita solo lo suyo.
    Route::get('perfil', [ProfileController::class, 'show'])->name('perfil');
    Route::put('perfil/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('perfil/apodo', [ProfileController::class, 'updateApodo']);
    Route::put('perfil/password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1');

    // Sabiá cantou: cualquier usuario ve, crea y edita; borrar pide permiso.
    Route::get('canciones', [SongController::class, 'index'])->name('canciones');
    Route::post('canciones', [SongController::class, 'store']);
    Route::put('canciones/{song}', [SongController::class, 'update']);

    // Galera: rodas y cantorias (agregar/eliminar/sincronizar pide permiso).
    Route::get('galera', [GaleraController::class, 'index'])->name('galera');
    Route::redirect('rodas', '/galera');

    // Política: documentos, sistema de cordas y manual de convivencia.
    Route::get('politica', [PoliticaController::class, 'index'])->name('politica');
    Route::inertia('politica/cordas', 'politica/cordas')->name('politica.cordas');
    Route::inertia('politica/manual', 'politica/manual')->name('politica.manual');

    // Archivos subidos (documentos de política): solo con sesión.
    Route::get('uploads/{path}', [UploadController::class, 'show'])->where('path', '.+')->name('uploads');

    // Páginas de ejemplo (contenido fijo, todavía sin base de datos).
    Route::inertia('articulos', 'articulos')->name('articulos');
    Route::inertia('movimientos', 'movimientos')->name('movimientos');
    Route::inertia('portugues', 'portugues')->name('portugues');

    // ── Según los permisos del rol (App\Support\Permissions) ──────────
    // El admin los tiene todos. Sin el permiso: 403.
    Route::delete('canciones/{song}', [SongController::class, 'destroy'])->middleware('can:'.Permissions::CANCIONES_ELIMINAR);

    Route::middleware('can:'.Permissions::GALERA_GESTIONAR)->group(function () {
        Route::post('galera/rodas', [GaleraController::class, 'storeRoda']);
        Route::delete('galera/rodas/{roda}', [GaleraController::class, 'destroyRoda']);
        Route::post('galera/rodas/sync', [GaleraController::class, 'syncRodas'])->middleware('throttle:6,1');
        Route::post('galera/cantorias', [GaleraController::class, 'storeCantoria']);
        Route::delete('galera/cantorias/{cantoria}', [GaleraController::class, 'destroyCantoria']);
        Route::post('galera/cantorias/sync', [GaleraController::class, 'syncCantorias'])->middleware('throttle:6,1');
    });

    // Con archivo adjunto: el formulario manda POST + _method=PUT
    // (PHP no interpreta multipart en un PUT real).
    Route::middleware('can:'.Permissions::POLITICA_GESTIONAR)->group(function () {
        Route::post('politica', [PoliticaController::class, 'store']);
        Route::put('politica/{politica}', [PoliticaController::class, 'update']);
        Route::delete('politica/{politica}', [PoliticaController::class, 'destroy']);
    });

    Route::get('admin/analytics', [AnalyticsController::class, 'index'])->name('admin.analytics')->middleware('can:'.Permissions::ANALITICAS_VER);

    // Encuentros: gestión (la página pública está arriba, sin sesión).
    // Con archivo (portada), editar va como POST + _method=PUT.
    Route::middleware('can:'.Permissions::ENCUENTROS_GESTIONAR)->prefix('encuentros')->group(function () {
        Route::get('/', [EncuentroController::class, 'index'])->name('encuentros');
        Route::get('nuevo', [EncuentroController::class, 'create'])->name('encuentros.nuevo');
        Route::post('/', [EncuentroController::class, 'store']);
        Route::get('{encuentro}', [EncuentroController::class, 'show'])->whereUuid('encuentro')->name('encuentros.show');
        Route::get('{encuentro}/editar', [EncuentroController::class, 'edit'])->whereUuid('encuentro');
        Route::put('{encuentro}', [EncuentroController::class, 'update'])->whereUuid('encuentro');
        Route::delete('{encuentro}', [EncuentroController::class, 'destroy'])->whereUuid('encuentro');
        Route::post('{encuentro}/publicar', [EncuentroController::class, 'publish'])->whereUuid('encuentro')->middleware('throttle:10,1');
        Route::post('{encuentro}/despublicar', [EncuentroController::class, 'unpublish'])->whereUuid('encuentro');
        Route::post('{encuentro}/inscripciones-abiertas', [EncuentroController::class, 'toggleInscripciones'])->whereUuid('encuentro');
        Route::get('{encuentro}/exportar', [InscripcionController::class, 'export'])->whereUuid('encuentro');
        Route::put('{encuentro}/inscripciones/{inscripcion}', [InscripcionController::class, 'update'])->whereUuid(['encuentro', 'inscripcion']);
    });

    // ── Solo administradores: usuarios y roles ───────────────────────
    // No son permisos asignables: así nadie puede darse más permisos.
    Route::middleware('admin')->group(function () {
        Route::prefix('admin')->group(function () {
            Route::get('roles', [RoleController::class, 'index'])->name('admin.roles');
            Route::post('roles', [RoleController::class, 'store']);
            Route::put('roles/{role}', [RoleController::class, 'update']);
            Route::delete('roles/{role}', [RoleController::class, 'destroy']);

            Route::get('usuarios', [UserController::class, 'index'])->name('admin.usuarios');
            Route::post('usuarios', [UserController::class, 'store']);
            Route::put('usuarios/{user}', [UserController::class, 'update']);
            Route::delete('usuarios/{user}', [UserController::class, 'destroy']);
        });
    });

    // ── Retos y árbol de habilidades ─────────────────────────────────
    // Se liberan por partes, cada una con su permiso (App\Support\RetosAcceso).
    // Las acciones de un reto revisan en el controlador el permiso de su
    // parte (Entrenar o el árbol); /retos, que tenga alguno de los dos.
    Route::prefix('retos')->group(function () {
        Route::get('/', [RetoController::class, 'index'])->name('retos');
        Route::post('{reto}/semana', [RetoController::class, 'startWeek'])->whereUuid('reto');
        Route::post('semanas/{semana}/abandonar', [RetoController::class, 'abandon'])->whereUuid('semana');
        Route::get('{reto}/entrenar', [RetoController::class, 'train'])->whereUuid('reto');
        Route::post('{reto}/entrenar', [RetoController::class, 'startSession'])->whereUuid('reto');
        Route::post('entrenamientos/{entrenamiento}/completar', [RetoController::class, 'complete'])->whereUuid('entrenamiento');

        // Árbol propio (?arbol=movimiento|musicalidad) y pedido de revisión.
        Route::middleware('can:'.Permissions::RETOS_ARBOL)->group(function () {
            Route::get('arbol', [ArbolController::class, 'show'])->name('retos.arbol');
            Route::post('habilidades/{habilidad}/revision', [RevisionController::class, 'request'])->whereUuid('habilidad');
        });

        Route::middleware('can:'.Permissions::RETOS_REVISAR)->group(function () {
            // Revisiones del reto secreto.
            Route::get('revisiones', [RevisionController::class, 'index'])->name('retos.revisiones');
            Route::post('revisiones/{revision}/aprobar', [RevisionController::class, 'approve'])->whereUuid('revision');
            Route::post('revisiones/{revision}/rechazar', [RevisionController::class, 'reject'])->whereUuid('revision');

            // Marcar a mano las habilidades dominadas de una persona.
            Route::get('personas', [PersonaController::class, 'index'])->name('retos.personas');
            Route::get('personas/{user}', [PersonaController::class, 'show'])->whereUuid('user');
            Route::post('personas/{user}/habilidades/{habilidad}', [PersonaController::class, 'mark'])->whereUuid(['user', 'habilidad']);
            Route::delete('personas/{user}/habilidades/{habilidad}', [PersonaController::class, 'unmark'])->whereUuid(['user', 'habilidad']);
        });

        // Controles de prueba (día simulado, cronómetro rápido, reinicio): solo admins.
        Route::middleware('admin')->prefix('demo')->group(function () {
            Route::post('dia-siguiente', [RetoDemoController::class, 'nextDay']);
            Route::post('hoy', [RetoDemoController::class, 'backToToday']);
            Route::post('rapido', [RetoDemoController::class, 'toggleFast']);
            Route::post('reiniciar', [RetoDemoController::class, 'reset']);
        });
    });
});
