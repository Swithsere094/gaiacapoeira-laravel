# Gaia Capoeira

Sitio web de la comunidad de capoeira **Areia no Mar**, en producción en [gaiacapoeira.com](https://gaiacapoeira.com). Es el espacio privado del grupo: sus integrantes entran con su cuenta para ver los videos de las rodas, aprender las canciones, consultar el calendario de clases y eventos y leer los documentos internos del grupo.

| Sección | Qué encuentras |
|---|---|
| Inicio | Accesos a cada sección y el calendario del mes |
| Galera | Videos de rodas y cantorias, tomados de las listas de YouTube del grupo |
| Sabiá cantou | El cancionero: letras, ritmos y video de cada canción, con un enlace para compartirla |
| Eventos | Calendario de clases, rodas y encuentros, en vista de mes o de semana |
| Política | Manual de convivencia, sistema de cordas y graduación, y documentos del grupo |
| Mi perfil | Datos personales, corda actual y cambio de contraseña |

## Roles

Cada persona tiene un rol que define qué puede hacer en el sitio.

- **Miembro**: ve todo el contenido y puede sumar canciones al cancionero.
- **Profesor**: además, crea y edita sus eventos en el calendario.
- **Administrador**: gestiona usuarios, roles, videos, documentos y analíticas.

Los roles se crean desde el propio sitio, eligiendo qué permisos tiene cada uno, así que sumar un rol nuevo no requiere tocar código.

## Historia

Esta es la segunda versión del sitio. La primera estaba hecha en Next.js y dejó de funcionar cuando el hosting compartido donde vive dejó de ejecutar aplicaciones Node. Se reescribió en Laravel con una regla: que el sitio hiciera exactamente lo mismo, sobre la misma base de datos y sin que los integrantes notaran el cambio ni tuvieran que crear de nuevo su contraseña.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Backend | Laravel 13 (PHP 8.3) |
| Frontend | React 19 con TypeScript, conectado a Laravel con Inertia |
| Estilos | Tailwind CSS 4 y componentes de shadcn/ui |
| Base de datos | MySQL / MariaDB |
| Publicación | GitHub Actions |

Cada cambio que llega a `main` pasa por las pruebas automáticas y, si todo sale bien, se publica solo en el sitio. Si la versión nueva no responde, el sitio vuelve a la anterior sin intervención.

## Desarrollo local

Requiere PHP 8.3, Composer, Node 22 y MySQL o MariaDB.

```
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

Completa en `.env` los datos de tu base de datos local y levanta el sitio con:

```
php artisan serve
npm run dev
```

Las pruebas se corren con `php artisan test`.
