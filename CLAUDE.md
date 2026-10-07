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
- **Vite (vite-plus)** para el frontend; **Wayfinder** genera rutas tipadas en `resources/js/actions|routes|wayfinder` (generado, en `.gitignore`; si `tsc` se queja de esos archivos: `php artisan wayfinder:generate --with-form`).
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
- `App\Http\Controllers\Auth\AuthController`: login, logout y "olvidé mi contraseña" (usuario + email coinciden → contraseña temporal de 10 caracteres sin caracteres confusos, mostrada **una vez** vía flash de sesión). Límites por IP que cuentan cada intento: **10 / 15 min** en login, **5 / 15 min** en olvidé contraseña. A diferencia del sitio anterior (Map en memoria), el contador vive en la caché de Laravel y sobrevive a reinicios.
- Todo el sitio requiere sesión (`auth`), salvo `/auth/login` y `/auth/olvide-contrasena` (`guest`). Admin: middleware alias `admin` (`EnsureUserIsAdmin`, responde 403).
- `HandleInertiaRequests` comparte `auth.user` **solo con los campos públicos** (misma forma que `AppUser` del sitio anterior) y `flash` (`success`, `error`, `tempPassword`).
- `PreventCaching` pone `Cache-Control: private, no-store` en toda respuesta (el CDN de Hostinger llegó a cachear HTML protegido en el sitio anterior). Va **primero** en el grupo `web` (prepend) para que el middleware de sesión no le pise la cabecera.

### Qué se quitó del kit (a propósito)

Fortify, registro público, verificación de email, 2FA, passkeys, páginas de ajustes, modo claro/oscuro, sidebar y `laravel/chisel`. El sitio no tiene nada de eso; si algún día se quiere alguna, se agrega de forma explícita.

## Frontend

- Cada página arma su propio layout (`Navigation` + contenido + `Footer`), como en el sitio anterior: no hay layout global en `app.tsx`.
- Los componentes se **portaron del sitio Next casi sin cambios**. Dos piezas de compatibilidad lo permiten:
  - `hooks/use-auth.ts`: misma interfaz que el `useAuth()` anterior, pero el usuario sale de las props de Inertia (nunca "carga").
  - `lib/navigation.ts`: `usePathname()` / `useSearchParams()` equivalentes a los de `next/navigation`.
- Los componentes de `components/ui/` son **los del sitio anterior** (no los del kit), para que el sitio se vea idéntico.
- Formularios: `useForm` / `router` de Inertia (CSRF automático). Nada de `fetch` a mano contra rutas que modifican datos.
- Lista de cordas: la UI usa `lib/constants/cordas.ts`; el servidor valida contra `App\Support\Cordas::IDS`. `tests/Unit/CordasTest.php` verifica que ambas listas y los PNG de `public/Cuerda x cuerda/` coincidan.
- Gotcha heredado de los PNG de cordas: mucho margen transparente y el dibujo descentrado hacia arriba → `style={{ transform: "translateY(9.6%) scale(1.8)" }}` con `translateY` **primero** (si se invierte el orden, el scale amplifica el translate).

## Desarrollo local

- PHP 8.3 (el PHP de XAMPP se actualizó a 8.3.35; respaldo del 8.2 en `C:\xampp\php-8.2.12-respaldo`), Composer 2.10, Node 22, MySQL de XAMPP.
- `php artisan serve` + `npm run dev` (o `npm run build`).
- Usuario de prueba en la copia local: `navbar_qa_test` / `navbar_qa_test_pw123` (admin, solo local).

## Regla obligatoria: chequeos antes de cada commit

Sin excepción (ni para commits "solo de docs"):

1. `php artisan test` (feature + unit; necesita MySQL local corriendo).
2. `npm run types:check` y `npm run build`.
3. `vendor/bin/pint --parallel` (formato PHP) y `vendor/bin/phpstan analyse` (análisis estático).

Si algo falla: parar, mostrar el error, corregir y volver a correr todo antes de comitear. Nunca comitear credenciales: el repo es **público** (`.env` está en `.gitignore`; revisar `git diff --cached --name-only` antes de comitear).

## Estado

- ✅ Fase 0: proyecto base. Fase 1: base de datos. Fase 2: auth, perfil y gestión de usuarios.
- ⏳ Fases 3 (canciones, rodas, cantorias, galera, YouTube), 4 (política, cordas, manual), 5 (analíticas, páginas de ejemplo), 5.1 (páginas de error), 5.2 (auditoría).
- ⏳ Fases 6 (publicación automática con GitHub Actions) y 7 (cambio en Hostinger): a hacer junto con el usuario.
