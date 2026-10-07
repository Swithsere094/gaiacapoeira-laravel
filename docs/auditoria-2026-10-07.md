# Auditoría de calidad y seguridad — 2026-10-07

Proyecto: gaiacapoeira-laravel (reescritura en Laravel 13 + Inertia + React del sitio Next.js).
Alcance: todo el código del repo al cierre de las fases 0–5.1, sus dependencias y su configuración.

## Cómo se hizo

- **Automático**: `composer audit`, `npm audit`, PHPStan (análisis estático de PHP), `vp check` (linter estricto con análisis de tipos + formato), `tsc`, y la suite de tests (112 tests).
- **Manual**: revisión de cada ruta y su control de acceso, validación de entradas, subida y entrega de archivos, sesión y cookies, cabeceras, límites de intentos, manejo de errores, uso de HTML sin escapar, consultas SQL crudas y secretos en el historial de git.
- Cada corrección quedó cubierta por un test que falla si se revierte.

## Resultado de los chequeos automáticos

| Chequeo | Resultado |
|---|---|
| `composer audit` | 0 vulnerabilidades |
| `npm audit` | 6 (5 críticas, 1 baja) → **0** tras actualizar (ver S9) |
| PHPStan | 0 errores |
| Linter (`vp check`, modo estricto) | 0 advertencias |
| TypeScript | 0 errores |
| Tests | 112 / 112 |
| Secretos en git | ninguno |
| HTML sin escapar / SQL con datos del usuario | ninguno |

## Hallazgos corregidos

Gravedad: **Crítica** (compromete el servidor), **Alta** (expone datos o rompe el acceso), **Media**, **Baja**.

| # | Gravedad | Hallazgo | Corrección |
|---|---|---|---|
| S1 | Crítica | La subida de documentos guardaba el archivo con **la extensión que mandaba el navegador**. En un hosting PHP, un `.php` subido a una carpeta pública se ejecuta en el servidor. (Heredado del sitio Next, donde no era explotable.) | Solo `pdf, doc, docx, txt, jpg, jpeg, png, webp`, validando extensión **y contenido real**, máx. 20 MB, nombre saneado. Además los archivos ya no están en una carpeta pública (S2). |
| S2 | Alta | Los **documentos de Política quedaban públicos**: en Laravel lo que está en `public/` lo entrega el servidor web sin pasar por el login (en Next pasaban por el filtro de sesión). | Se guardan en `storage/app/uploads` (fuera de `public/`) y se entregan con la ruta `/uploads/{path}`, que exige sesión. **Misma URL de siempre**. |
| S3 | Alta | Detrás del CDN de Hostinger todas las visitas llegan con la IP del proxy: el límite de 10 intentos de login por IP se habría vuelto **global** (10 errores de cualquiera bloquean el login de todos). | `App\Support\ClientIp` usa la última IP de `X-Forwarded-For` (la que agrega el proxy; la que puede inventar el visitante va primero y se ignora). **Pendiente verificar en producción** (fase 7) el formato real de la cabecera en Hostinger. |
| S4 | Media | Cualquier miembro podía cargar como "video" de una canción **cualquier URL**, que se embebe dentro del sitio para todos (ej. un formulario falso). El navegador además aceptaba cualquier URL que *contuviera* `youtube.com/embed/`. | Solo YouTube/Vimeo, validando el dominio exacto (`App\Rules\VideoUrl`); el reproductor siempre se arma con el ID del video, nunca con la URL tal cual. Todos los videos existentes son de YouTube. |
| S5 | Media | El servidor aceptaba cualquier `file_url` que mandara el navegador, y al borrar un documento se borraba esa ruta del disco (con `..` se podía apuntar fuera de la carpeta). | La URL la decide el servidor; borrar solo actúa dentro de la carpeta de subidas (`realpath`). |
| S6 | Baja | El registro de visitas era un endpoint **público** (`/api/analytics/pageview`): cualquiera podía cargar visitas falsas. | Lo registra el servidor al entregar cada página; el endpoint ya no existe. |
| S7 | Baja | Sin cabeceras de seguridad. | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS (solo por https) en todas las respuestas, incluidas las de error. |
| S8 | Baja | El avatar del perfil aceptaba cualquier texto; el mínimo de 6 caracteres de contraseña solo lo validaba el navegador; en "Mi perfil" un admin cambiaba su contraseña sin dar la actual. | Avatar validado contra la lista de cordas; mínimo de contraseña también en el servidor; la contraseña actual se pide siempre. |
| S9 | Media (solo desarrollo) | 6 vulnerabilidades en herramientas de desarrollo (`vite-plus`/`oxfmt`/`tinypool`, `concurrently`/`shell-quote`, `@babel/core`). No llegan al sitio publicado (solo se publican archivos compilados). | `vite-plus` 0.3.3, `concurrently` 10.0.5, y versiones parcheadas forzadas de `shell-quote` y `@babel/core` (`overrides`). |
| C1 | Calidad | Al reemplazar el archivo de un documento, el viejo quedaba huérfano en el disco. | Se borra. |
| C2 | Calidad | La sesión duraba 2 horas (default de Laravel) en vez de los 7 días del sitio anterior. | `SESSION_LIFETIME=10080`. |
| C3 | Calidad | Código portado con estilos mezclados; dependencias del kit sin uso (Wayfinder, Fortify, passkeys, etc.). | Formato uniforme con el formateador del proyecto; se quitó todo lo que no se usa. |

## Verificado sin problemas

- **Control de acceso**: todas las rutas exigen sesión salvo login / olvidé contraseña; las de admin responden 403 a miembros (probado ruta por ruta en los tests). Nadie puede editar el perfil de otro.
- **CSRF**: activo en todas las acciones (Inertia lo maneja con la cookie `XSRF-TOKEN`).
- **Sesión**: se regenera al iniciar sesión y se invalida al cerrarla; cookie `HttpOnly`, `SameSite=Lax`, cifrada.
- **XSS**: React escapa todo; no hay `dangerouslySetInnerHTML` con datos del usuario (el único es el de los colores del gráfico, con valores fijos).
- **SQL**: todo pasa por Eloquent con parámetros; las 2 expresiones crudas son textos fijos.
- **Errores**: en producción no se muestran detalles internos (probado: el mensaje de una excepción no aparece en la página 500).
- **Contraseñas**: bcrypt; los hashes nunca se envían al navegador (probado).
- **Secretos**: `.env` fuera de git; ningún secreto en el historial.

## Decisiones pendientes (no se cambiaron: cambian cómo funciona algo)

| # | Gravedad | Hallazgo | Opciones |
|---|---|---|---|
| P1 | **Alta** | **"Olvidé mi contraseña" permite tomar cualquier cuenta conociendo su usuario y email**: muestra una contraseña nueva en pantalla a quien acierte la combinación (el email suele ser fácil de adivinar o conocer). Además invalida la contraseña del dueño. Es el comportamiento del sitio original. | (a) Enviar la contraseña temporal **por email** al dueño (requiere configurar el correo de Hostinger). (b) Quitar el autoservicio: el admin resetea desde Gestión de Usuarios (ya existe). (c) Mantenerlo como está. **Recomendado: (a), o (b) mientras tanto.** |
| P2 | Media | El límite de intentos de login es solo por IP: alguien con muchas IPs podría probar contraseñas contra una cuenta. | Agregar además un límite por usuario (contra: permite bloquearle el login a alguien a propósito por 15 min). |
| P3 | Baja–Media | Contraseña mínima de 6 caracteres. | Subir a 8 o más (solo afectaría contraseñas nuevas). |
| P4 | Baja | Un admin puede quitarse su propio rol o borrar a los demás admins: el sitio podría quedar sin ningún admin. | Impedir que un admin se quite el rol a sí mismo y que se borre el último admin. |
| P5 | Baja | No hay Content-Security-Policy. | Agregarla con el inventario de orígenes (YouTube, Vimeo); hacerlo con calma y probando. |
| P6 | Calidad | Las canciones nuevas no guardan quién las creó (`songs.user_id`), igual que en el sitio original. | Guardarlo (invisible para el usuario). |
| P7 | UX | Confirmaciones y avisos usan las ventanas nativas del navegador (`confirm`/`alert`), como en el original. | Diálogos con el estilo del sitio. |

## Para la fase 7 (publicación)

- Verificar en Hostinger el formato real de `X-Forwarded-For` (S3) y que la app vea las visitas por https.
- Valores obligatorios del `.env` de producción: ver el final de `.env.example`.
- La raíz pública del dominio tiene que ser la carpeta `public/` de Laravel (nunca la raíz del proyecto).
- Copiar los documentos existentes de `nodejs/public/uploads/politica/` a `storage/app/uploads/politica/`.
