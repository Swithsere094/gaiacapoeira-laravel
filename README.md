<div align="center">

# Gaia Capoeira

Sitio web de la comunidad de capoeira **Areia no Mar**.

[![Sitio en producción](https://img.shields.io/badge/en_vivo-gaiacapoeira.com-AF9A4F?style=for-the-badge)](https://gaiacapoeira.com)
[![CI y publicación](https://img.shields.io/github/actions/workflow/status/Swithsere094/gaiacapoeira-laravel/ci-deploy.yml?branch=main&style=for-the-badge&label=CI%20%2F%20deploy)](https://github.com/Swithsere094/gaiacapoeira-laravel/actions/workflows/ci-deploy.yml)

![Laravel](https://img.shields.io/badge/Laravel_13-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP_8.3-777BB4?style=flat-square&logo=php&logoColor=white)
![Inertia](https://img.shields.io/badge/Inertia_3-9553E9?style=flat-square&logo=inertia&logoColor=white)
![React](https://img.shields.io/badge/React_19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat-square&logo=mariadb&logoColor=white)

</div>

---

## Qué es

El espacio privado del grupo: sus integrantes ven los videos de las rodas y cantorias, consultan y comparten el cancionero, revisan el calendario de clases y eventos y leen los documentos internos del grupo (manual de convivencia, sistema de cordas y graduación). Todo el sitio exige sesión.

Este repositorio es la **segunda versión** del sitio. La primera, en Next.js ([`gaiacapoeira`](https://github.com/Swithsere094/gaiacapoeira)), dejó de poder ejecutarse cuando el hosting compartido bloqueó las aplicaciones Node. Como PHP sí corre nativo ahí, se reescribió en Laravel con una regla: **migración 1 a 1**, sobre la misma base de datos de producción y sin que los usuarios notaran el cambio.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| 🎥 **Galera** | Videos de rodas y cantorias, sincronizados con playlists de YouTube (pagina la API, salta los ya guardados y los privados). |
| 🎶 **Sabiá cantou** | Cancionero con letras, ritmos y video. Cada canción tiene un enlace para compartir que abre el sistema de compartir del celular. |
| 📅 **Calendario** | Vista de mes y de semana, eventos de un día, de varios días o recurrentes. Las repeticiones se calculan, no se guardan. |
| 📜 **Política** | Documentos internos con archivos adjuntos, el manual de convivencia escrito en MDX y el sistema de cordas. |
| 👥 **Usuarios y roles** | Roles creados desde la interfaz, con permisos definidos en el código y revisados como *Gates* de Laravel. |
| 📈 **Analíticas** | Registro de visitas propio desde el servidor, con un panel de los últimos 30 días. Sin servicios de terceros. |

## Detalles técnicos

- **Compatibilidad con la base heredada.** La migración inicial describe las 13 tablas que ya existían en producción, idénticas a `SHOW CREATE TABLE`, y solo las crea si faltan. Los hashes `$2b$` de bcryptjs se aceptan y se reescriben como `$2y$` en el siguiente login, así nadie tuvo que cambiar su contraseña.
- **Publicación automática con rollback.** Cada push a `main` corre los tests contra MariaDB, compila en GitHub Actions, sube una versión nueva por rsync, aplica las migraciones y cambia un enlace simbólico de forma atómica. Si la prueba de salud falla, vuelve sola a la versión anterior. Guarda las 5 últimas.
- **Auditoría de seguridad.** Límites de intentos de login por IP y por cuenta (leyendo la IP real detrás del proxy), subidas validadas por contenido y servidas fuera de `public/` solo con sesión, URLs de video restringidas a YouTube y Vimeo, cabeceras de seguridad y `Cache-Control: no-store` para que el CDN no cachee páginas privadas. El informe está en [`docs/auditoria-2026-10-07.md`](docs/auditoria-2026-10-07.md).
- **Páginas de error propias** en React para 403, 404, 405, 413, 419, 429, 500 y 503, con respaldo en HTML puro por si React no puede renderizar.
- **Calidad.** Más de 150 pruebas con PHPUnit, PHPStan (Larastan), Pint, chequeo de tipos de TypeScript y linter estricto en el frontend. Todo corre antes de cada commit y en la CI.

## Desarrollo local

Requiere PHP 8.3, Composer, Node 22 y MySQL o MariaDB.

```bash
composer install
npm install
cp .env.example .env        # completar los datos de la base local
php artisan key:generate
php artisan migrate

php artisan serve           # backend
npm run dev                 # frontend con recarga en caliente
```

### Chequeos

```bash
php artisan test            # pruebas (necesita MySQL corriendo)
npm run types:check         # tipos de TypeScript
npm run build               # compilación de producción
vendor/bin/pint --parallel  # formato PHP
vendor/bin/phpstan analyse  # análisis estático
npm run check               # linter y formato del frontend
```

## Más contexto

- [`docs/auditoria-2026-10-07.md`](docs/auditoria-2026-10-07.md): informe de la auditoría de calidad y seguridad, con las decisiones tomadas.
- [`.github/workflows/ci-deploy.yml`](.github/workflows/ci-deploy.yml): pipeline de pruebas y publicación.
