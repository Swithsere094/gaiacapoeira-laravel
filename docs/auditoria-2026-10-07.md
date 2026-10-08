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
| S3 | Alta | Detrás del CDN de Hostinger todas las visitas llegan con la IP del proxy: el límite de 10 intentos de login por IP se habría vuelto **global** (10 errores de cualquiera bloquean el login de todos). | `App\Support\ClientIp` usa la última IP de `X-Forwarded-For` (la que agrega el proxy; la que puede inventar el visitante va primero y se ignora). ✅ **Verificado en Hostinger (2026-10-08)**: con una IP inventada en la cabecera llega `6.6.6.6, <IP real>`; la última es la real. |
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

## Decisiones tomadas

| # | Gravedad | Hallazgo | Decisión |
|---|---|---|---|
| P1 | **Alta** | **"Olvidé mi contraseña" permitía tomar cualquier cuenta conociendo su usuario y email**: mostraba una contraseña nueva en pantalla a quien acertara la combinación, e invalidaba la del dueño. Era el comportamiento del sitio original. | ✅ **Resuelto (2026-10-07), opción (b)**: se quitó el autoservicio. Si alguien olvida su contraseña, un admin le asigna una nueva desde Gestión de Usuarios. El login lo explica y la dirección vieja redirige al login. Probado en tests y en navegador (el admin asigna la clave nueva y la persona entra con ella). Si en el futuro se quiere autoservicio, que sea por email al dueño de la cuenta (opción (a) original). |
| P2 | Media | El límite de intentos de login era solo por IP: alguien con muchas IPs podía probar contraseñas contra una cuenta. | ✅ **Resuelto (2026-10-07), opción (a)**: además del límite por IP hay uno **por usuario** (10 intentos fallidos / 15 min; un login correcto lo reinicia). Contra aceptado: alguien podría bloquearle el login a otra persona a propósito por 15 minutos. El mensaje es el mismo exista o no el usuario. |
| P3 | Baja–Media | Contraseña mínima de 6 caracteres. | ✅ **Resuelto (2026-10-07), opción (a)**: mínimo **8** caracteres, en Gestión de Usuarios (crear/editar) y en Mi perfil. Solo afecta contraseñas nuevas: las existentes siguen funcionando. |
| P4 | Baja | Un admin podía quitarse su propio rol: el sitio podía quedar sin ningún admin. | ✅ **Resuelto (2026-10-07), opción (a)**: un admin **no puede quitarse su propio rol** (el selector aparece bloqueado con una explicación y el servidor lo rechaza). Como tampoco puede eliminarse a sí mismo, siempre queda al menos un admin: el que está haciendo los cambios. Sí puede quitarle el rol a otro admin. |
| P5 | Baja | No hay Content-Security-Policy. | ⏸️ **Postergado a propósito (2026-10-07), opción (b)**: por ahora no se agrega. El riesgo que mitigaría (código inyectado en la página) ya está cubierto en buena parte: React escapa todo el contenido, los videos solo se embeben desde YouTube/Vimeo armando la URL desde el ID, y el resto de las cabeceras de seguridad están activas. Si se retoma: hacer el inventario de orígenes (YouTube, Vimeo, Google Fonts si aplica, el propio sitio para Vite en producción), empezar en modo `Content-Security-Policy-Report-Only` y probar todas las páginas antes de activarla. |
| P6 | Calidad | Las canciones nuevas no guardan quién las creó (`songs.user_id`), igual que en el sitio original. | ❌ **No se hace (2026-10-07), opción (b)**: se mantiene como en el sitio original. |
| P7 | UX | Confirmaciones y avisos usaban las ventanas nativas del navegador (`confirm`/`alert`), como en el original. | ✅ **Resuelto (2026-10-07), opción (a)**: diálogos con el estilo del sitio (`components/confirm-dialog.tsx`) al eliminar canciones, rodas, cantorias, documentos y usuarios, y para los avisos de error. |

## Para la fase 7 (publicación)

- Verificar en Hostinger el formato real de `X-Forwarded-For` (S3) y que la app vea las visitas por https.
- Valores obligatorios del `.env` de producción: ver el final de `.env.example`.
- La raíz pública del dominio tiene que ser la carpeta `public/` de Laravel (nunca la raíz del proyecto).
- Copiar los documentos existentes de `nodejs/public/uploads/politica/` a `storage/app/uploads/politica/`.
