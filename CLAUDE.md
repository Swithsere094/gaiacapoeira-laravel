# CLAUDE.md

Contexto para trabajar en este repo. Léelo antes de tocar auth, base de datos o despliegue: hay decisiones no obvias que no se ven solo mirando el código.

## Qué es esto

Reescritura en **Laravel + React (Inertia)** del sitio de la comunidad de capoeira **gaiacapoeira.com** ("Areia no Mar"): rodas y cantorias (videos), cancionero "Sabiá cantou", documentos de política interna (manual de convivencia, cordas), perfiles y gestión de usuarios, analíticas propias.

El sitio anterior era Next.js (repo `Swithsere094/gaiacapoeira`, carpeta local `Desktop/capoeira-para-hostinger`) y **se dejó de poder ejecutar en el hosting compartido de Hostinger** a fines de septiembre de 2026: Hostinger bloqueó los puertos locales TCP y su supervisor de Node (lsnode) dejó de entregarle las peticiones a la app. Está documentado a fondo en el `CLAUDE.md` de ese repo. PHP corre nativo en ese hosting, por eso se migró a Laravel (decisión del 2026-10-07).

**Regla de la migración: 1 a 1.** El sitio nuevo hace lo mismo que el anterior. Las mejoras que se detecten se anotan y se consultan, no se cambian sin preguntar.

Quien mantiene este repo no programa: trabaja exclusivamente a través de Claude Code.

## Stack

- **Laravel 13** (PHP 8.3) + **Inertia 3** + **React 19** + TypeScript + **Tailwind 4** + shadcn/ui (estilo new-york). Generado desde el kit oficial `laravel/react-starter-kit` y recortado (ver "Qué se quitó del kit").
- **MySQL/MariaDB** con Eloquent. **npm** como gestor de paquetes (no pnpm).
- **Vite (vite-plus)** para el frontend. Las páginas usan URLs simples (como el sitio anterior); **Wayfinder** (rutas tipadas del kit) se quitó porque no se usaba y su generador chocaba con `Route::redirect` (método HTTP `QUERY` de Laravel 13 que sus tipos TS no conocen).
- Único tema oscuro (paleta azul profundo `#02141B` + dorado `#AF9A4F`), tipografías Bitter (títulos, `font-serif`) e Inter (texto, `font-sans`), servidas localmente vía `laravel-vite-plugin/fonts` (bunny).

## Base de datos

### La base heredada

La base de producción ya tiene **13 tablas con datos reales**, creadas por drizzle en el sitio anterior: `usuarios`, `cantorias`, `politica`, `rodas`, `songs`, `page_views` (en uso) y `articles`, `movements`, `portuguese_lessons`, `portuguese_vocabulary`, `comments`, `favorites`, `user_lesson_progress` (sin uso todavía). También queda una tabla `__drizzle_migrations` del sitio anterior: inofensiva, se puede borrar cuando el sitio viejo ya no exista.

- `database/migrations/0001_01_01_000000_create_gaia_base_schema.php` describe esas 13 tablas **idénticas** a producción (verificado comparando `SHOW CREATE TABLE`, cero diferencias). Cada tabla se crea **solo si no existe**: sobre la base real no hace nada, así que `php artisan migrate` es seguro en producción. Su `down()` está vacío **a propósito** (un rollback nunca debe borrar datos reales).
- Laravel agrega solo `sessions` (con `user_id` CHAR(36)), `cache` y `cache_locks`. No hay tabla `jobs`: `QUEUE_CONNECTION=sync` (hosting compartido, sin worker).
- **IDs UUID CHAR(36)** generados por la app (`HasUuids`).
- **Política de FKs en `user_id`** (heredada): contenido curado (`rodas`, `songs`, `articles`, `movements`, `portuguese_lessons`, `page_views`) → nullable + `ON DELETE SET NULL`; datos propios del usuario (`comments`, `favorites`, `user_lesson_progress`) → NOT NULL + `ON DELETE CASCADE`.
- Columnas tipo lista (`tags`, `participants`, ...) son JSON: en los modelos van con cast `'array'`.
- Fechas de evento con cast `'date:Y-m-d'` (el frontend recibe `"2026-07-02"`, como antes).
- `created_at` lo pone siempre la app (Eloquent), no el default `CURRENT_TIMESTAMP` de la columna: el huso horario de la sesión de MySQL puede no ser UTC y correr el día (gotcha heredado de las analíticas).

### Bases locales

- `capoeira_laravel`: **copia** de la base local del sitio anterior (`capoeira`, con datos reales migrados). La original no se toca.
- `capoeira_laravel_test`: descartable, la usan los tests (`phpunit.xml`), se recrea en cada corrida (`RefreshDatabase`).
- Se usa MySQL también en tests (no SQLite) porque JSON y ENUM se comportan distinto.

## Auth

- Modelo `App\Models\User` sobre la tabla **`usuarios`** (no `users`): login por **`username`**, contraseña en **`password_hash`** (`$authPasswordName`), sin `remember_token` (`$rememberTokenName = ''`, el sitio nunca tuvo "recordarme"). Roles: `admin` | `member` (`isAdmin()`).
- **Gotcha de los hashes heredados**: bcryptjs guardó los hashes con prefijo `$2b$`; PHP genera `$2y$`. Es el mismo algoritmo y `password_verify` valida ambos, pero la comprobación estricta de Laravel rechaza `$2b$`. Por eso `config/hashing.php` tiene `'verify' => false` **fijo** (no por `.env`, para que no se pueda olvidar en producción). Laravel re-guarda cada hash como `$2y$` en el siguiente login de esa persona. Los usuarios conservan su contraseña.
- `App\Http\Controllers\Auth\AuthController`: login y logout. Dos límites: **10 intentos / 15 min por IP** (cuenta cada intento) y **10 intentos fallidos / 15 min por usuario** (auditoría P2: frena a quien prueba contraseñas contra una cuenta desde muchas IPs; un login correcto lo reinicia). A diferencia del sitio anterior (Map en memoria), el contador vive en la caché de Laravel y sobrevive a reinicios.
- **No hay "olvidé mi contraseña" de autoservicio** (decisión del usuario, 2026-10-07, auditoría P1): el del sitio anterior entregaba una contraseña nueva en pantalla a quien supiera usuario + email, o sea que permitía tomar cualquier cuenta. Si alguien olvida su contraseña, **un admin le asigna una nueva** desde Gestión de Usuarios (editar → "Generar aleatoria"). El login lo explica en un texto; la dirección vieja `/auth/olvide-contrasena` redirige al login. **No volver a agregar un autoservicio que muestre la contraseña en pantalla**; si se quiere autoservicio, que sea mandando la contraseña o un enlace por email al dueño de la cuenta.
- **Contraseñas: mínimo 8 caracteres** (auditoría P3), en Gestión de Usuarios y en Mi perfil (servidor y formulario).
- **Un admin no puede quitarse su propio rol** (auditoría P4) ni eliminarse a sí mismo: así siempre queda al menos un admin. Sí puede quitarle el rol a otro admin.
- Todo el sitio requiere sesión (`auth`), salvo `/auth/login` (`guest`). Admin: middleware alias `admin` (`EnsureUserIsAdmin`, responde 403).
- `HandleInertiaRequests` comparte `auth.user` **solo con los campos públicos** (misma forma que `AppUser` del sitio anterior) y `flash` (`success`, `error`).
- `PreventCaching` pone `Cache-Control: private, no-store` en toda respuesta (el CDN de Hostinger llegó a cachear HTML protegido en el sitio anterior). Va **primero** en el grupo `web` (prepend) para que el middleware de sesión no le pise la cabecera.

### Qué se quitó del kit (a propósito)

Fortify, registro público, verificación de email, 2FA, passkeys, páginas de ajustes, modo claro/oscuro, sidebar, Wayfinder y `laravel/chisel`. El sitio no tiene nada de eso; si algún día se quiere alguna, se agrega de forma explícita.

## Frontend

- Cada página arma su propio layout (`Navigation` + contenido + `Footer`), como en el sitio anterior: no hay layout global en `app.tsx`.
- Los componentes se **portaron del sitio Next casi sin cambios**. Dos piezas de compatibilidad lo permiten:
  - `hooks/use-auth.ts`: misma interfaz que el `useAuth()` anterior, pero el usuario sale de las props de Inertia (nunca "carga").
  - `lib/navigation.ts`: `usePathname()` / `useSearchParams()` equivalentes a los de `next/navigation`.
- Los componentes de `components/ui/` son **los del sitio anterior** (no los del kit), para que el sitio se vea idéntico.
- **Confirmaciones y avisos**: `useConfirm()` de `components/confirm-dialog.tsx` (`await confirm({...})` / `await notify({...})`), montado una vez en `app.tsx`. **No usar `confirm()` / `alert()` del navegador** (auditoría P7).
- Formularios: `useForm` / `router` de Inertia (CSRF automático). Nada de `fetch` a mano contra rutas que modifican datos.
- Lista de cordas: la UI usa `lib/constants/cordas.ts`; el servidor valida contra `App\Support\Cordas::IDS`. `tests/Unit/CordasTest.php` verifica que ambas listas y los PNG de `public/Cuerda x cuerda/` coincidan.
- Gotcha heredado de los PNG de cordas: mucho margen transparente y el dibujo descentrado hacia arriba → `style={{ transform: "translateY(9.6%) scale(1.8)" }}` con `translateY` **primero** (si se invierte el orden, el scale amplifica el translate).

## Contenido (fase 3)

- **Sabiá cantou** (`SongController`, página `canciones`): ver/crear/editar → cualquier sesión; borrar → admin. `nossa`: al crear la marca cualquiera; al editar solo un admin la cambia (si la manda un miembro se ignora). Los ritmos van en `tags` (lista JSON).
- **Galera** (`GaleraController`, página `galera`, pestañas `?tab=rodas|cantorias`): agregar/eliminar rodas y cantorias y sincronizar con YouTube → solo admin. `/rodas` redirige a `/galera`.
- **Sincronización con YouTube** (`App\Services\YouTubePlaylist`): recorre todas las páginas de la playlist, saltea los videos ya guardados (comparando el ID de 11 caracteres extraído de `video_url`, `App\Support\VideoUrl`) y los privados/eliminados (sin miniaturas). Variables: `YOUTUBE_API_KEY`, `YOUTUBE_PLAYLIST_ID` (rodas), `YOUTUBE_CANTORIAS_PLAYLIST_ID`. Sigue siendo **manual** (decisión de producto heredada: se descartó el cron). En tests se simula con `Http::fake`.
- El resultado de acciones como la sincronización llega como flash `success` / `error`.

## Política (fase 4)

- **Documentos** (`PoliticaController`, página `politica`): ver → cualquier sesión; crear/editar/eliminar → admin. Categorías fijas (`PoliticaController::CATEGORIES`). Las tarjetas de "Manual de Convivencia" y "Cordas y Graduación" abren las páginas propias (`/politica/manual`, `/politica/cordas`), no un archivo.
- **Archivos subidos** (`App\Support\Uploads`): se guardan en **`storage/app/uploads/<carpeta>/`** (fuera de `public/`, configurable en `config/filesystems.php` → `uploads_root`) como `<ms>_<nombre_seguro>.<ext>`, y se entregan con la ruta **`GET /uploads/{path}`** (`UploadController`, **exige sesión**). La URL es la **misma del sitio anterior**, así los `file_url` ya guardados siguen andando. **No mover los archivos a `public/`**: lo que está ahí lo sirve el servidor web directo, sin login (en el sitio Next los PDFs sí pasaban por el filtro de sesión), y en un hosting PHP un archivo subido en una carpeta pública podría ejecutarse. El archivo viaja en la **misma petición** que el documento y la URL la decide el servidor (el sitio anterior aceptaba cualquier `file_url` del navegador). Con archivo, editar va como `POST` + `_method=put` (PHP no parsea multipart en un PUT real).
- **Seguridad de subidas**: solo `pdf, doc, docx, txt, jpg, jpeg, png, webp`, validando extensión **y contenido real** (`extensions` + `mimes`), máx 20 MB. Borrar y descargar solo actúan dentro de la carpeta de subidas (`Uploads::pathFor` resuelve `realpath`). Reemplazar o quitar el archivo de un documento borra el anterior del disco.
- En tests, `PoliticaTest` apunta `filesystems.uploads_root` a una carpeta temporal; para probar archivos disfrazados usa archivos reales en disco (los `UploadedFile::fake()` declaran el tipo por la extensión, no por el contenido).
- **Manual de Convivencia y Ética**: `resources/js/content/politica/manual-convivencia.mdx`, compilado con `@mdx-js/rollup` (en `vite.config.ts`, con `enforce: 'pre'` antes del plugin de React) y estilizado con `components/mdx-components.tsx`. El índice lateral sale de `lib/constants/manual-sections.ts`; `tests/Unit/ManualSectionsTest.php` verifica que coincida con las secciones del `.mdx`.

## Analíticas y páginas de ejemplo (fase 5)

- **Registro de visitas en el servidor** (`App\Http\Middleware\TrackPageView`, en el grupo `web`): al entregar una página (GET 2xx, HTML o visita de Inertia) guarda `path` (sin query), `user_id` (o null sin sesión, ej. `/auth/login`) y `created_at`. No cuenta redirecciones, errores, acciones (POST/PUT/DELETE), recargas parciales de Inertia, prefetch ni `/up`. Si falla el insert, se reporta y la página igual responde. **Cambio deliberado respecto del sitio anterior**: allá lo hacía el navegador con un POST a un endpoint **público** (`/api/analytics/pageview`) que cualquiera podía llamar con rutas inventadas; ese endpoint ya no existe.
- **Panel** `/admin/analytics` (`Admin\AnalyticsController`, solo admin): totales, usuarios distintos, top 15 páginas y visitas por día de los últimos 30 días. El agrupado por día se hace en PHP en UTC (no con `DATE()` de MySQL), por el gotcha de husos horarios.
- **Artículos, movimientos y portugués** (`/articulos`, `/movimientos`, `/portugues`): páginas con contenido fijo de ejemplo, igual que en el sitio anterior. Sus tablas (`articles`, `movements`, `portuguese_*`) existen pero todavía no tienen backend.

## Páginas de error (fase 5.1)

Errores que la app puede devolver y cuándo: **403** (miembro en ruta de admin), **404** (ruta inexistente o registro borrado — route model binding), **405** (método equivocado, ej. GET `/auth/logout`), **413** (subida más grande que `post_max_size`), **419** (sesión/CSRF vencido), **429** (rutas con `throttle`), **500** (inesperado), **503** (`php artisan down`).

- **Página propia en React**: `resources/js/pages/error.tsx` (tarjeta centrada como el login, textos en `resources/js/lib/errors.ts`). Es **autónoma**: no usa la navegación ni `auth` de las props compartidas, porque en un 404 de ruta inexistente Laravel responde sin abrir la sesión ni pasar por `HandleInertiaRequests`.
- **Cableado** en `bootstrap/app.php` (`$exceptions->respond(...)`): para esos códigos devuelve la página de Inertia con el código correcto, `Cache-Control: private, no-store` y conserva `Retry-After`. Excepciones: el **500 con `APP_DEBUG=true`** muestra el detalle técnico de Laravel (desarrollo), y los clientes que piden JSON (no Inertia) reciben JSON.
- **Respaldo en HTML puro**: `resources/views/errors/{403,404,405,413,419,429,500,503}.blade.php` + `layout.blade.php`, con estilos en línea (no dependen de Vite, sesión ni base). Se usan si la página de React no se puede renderizar (el `respond` captura la falla y devuelve la respuesta original de Laravel, que usa estas vistas) — probado en `ErrorPagesTest`. Mantener sus textos iguales a `lib/errors.ts`. Se extienden con `@extends('errors.layout')` (no `errors::`, ese prefijo solo existe mientras Laravel renderiza un error).

## Seguridad (auditoría, fase 5.2)

Informe completo y decisiones tomadas: `docs/auditoria-2026-10-07.md`. Lo que hay que saber al tocar el código:

- **IP del visitante para límites de intentos**: `App\Support\ClientIp` (última IP de `X-Forwarded-For`, la que agrega el proxy de Hostinger). **No usar `trustProxies('*')`** ni `$request->ip()` para eso: con el proxy delante, `ip()` sería la del proxy (límite global) y `trustProxies('*')` devuelve la primera IP de la cabecera, que el visitante puede inventar. Pendiente verificar el formato real en producción.
- `songs.user_id` **no se guarda** al crear canciones, igual que en el sitio original (decisión del usuario, auditoría P6).
- **Videos**: solo YouTube/Vimeo (`App\Rules\VideoUrl`, por dominio exacto) en canciones, rodas y cantorias; en el navegador `toEmbedUrl()` arma siempre la URL del reproductor desde el ID y devuelve `''` si no reconoce la URL (nunca embebe la URL tal cual).
- **Cabeceras**: `SecurityHeaders` (middleware global) agrega `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS por https. **No hay Content-Security-Policy, a propósito** (decisión del usuario, 2026-10-07, auditoría P5): se postergó. Si se retoma, cómo hacerlo está en el informe de auditoría (empezar en modo `Report-Only`).
- **https detrás del proxy**: en producción, si `APP_URL` es https, `AppServiceProvider` fuerza `URL::forceScheme('https')`.
- **Sesión**: 7 días (`SESSION_LIFETIME=10080`, como el sitio anterior); en producción `SESSION_SECURE_COOKIE=true`. Valores obligatorios de producción: al final de `.env.example`.
- **Dependencias**: `npm audit` y `composer audit` en 0. Hay `overrides` en `package.json` para forzar versiones parcheadas de `shell-quote` y `@babel/core`, y `vite` es un alias de `@voidzero-dev/vite-plus-core` (lo exige `vite-plus` ≥ 0.3.3; no cambiarlo por `vite` a secas).

## Desarrollo local

- PHP 8.3 (el PHP de XAMPP se actualizó a 8.3.35; respaldo del 8.2 en `C:\xampp\php-8.2.12-respaldo`), Composer 2.10, Node 22, MySQL de XAMPP.
- `php artisan serve` + `npm run dev` (o `npm run build`).
- Usuario de prueba en la copia local: `navbar_qa_test` / `navbar_qa_test_pw123` (admin, solo local).

## Regla obligatoria: chequeos antes de cada commit

Sin excepción (ni para commits "solo de docs"):

1. `php artisan test` (feature + unit; necesita MySQL local corriendo).
2. `npm run types:check` y `npm run build`.
3. `vendor/bin/pint --parallel` (formato PHP) y `vendor/bin/phpstan analyse` (análisis estático).
4. `npm run check` (linter estricto + formato del frontend; `npm run check:fix` corrige el formato).

Si algo falla: parar, mostrar el error, corregir y volver a correr todo antes de comitear. Nunca comitear credenciales: el repo es **público** (`.env` está en `.gitignore`; revisar `git diff --cached --name-only` antes de comitear).

## Estado

- ✅ Fase 0: proyecto base. Fase 1: base de datos. Fase 2: auth, perfil y gestión de usuarios. Fase 3: canciones, galera y sync con YouTube. Fase 4: política, cordas y manual. Fase 5: analíticas y páginas de ejemplo. Fase 5.1: páginas de error. Fase 5.2: auditoría (ver `docs/auditoria-2026-10-07.md`; todas las decisiones P1–P7 tomadas y aplicadas: P5 (CSP) postergada y P6 (`songs.user_id`) descartada, a propósito).
- ⏳ Fases 6 (publicación automática con GitHub Actions) y 7 (cambio en Hostinger): a hacer junto con el usuario.
