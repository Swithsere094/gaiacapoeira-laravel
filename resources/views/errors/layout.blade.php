<!DOCTYPE html>
{{--
    Versión de respaldo de las páginas de error, en HTML puro con estilos en
    línea: se usa solo si la página de React (resources/js/pages/error.tsx) no
    se puede mostrar (ej. falta el build del frontend o falla la app). No
    depende de Vite, de la sesión ni de la base de datos. Mismos colores y
    textos que la versión de React (resources/js/lib/errors.ts).
--}}
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>@yield('title') - Areia no Mar</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; background: #02141b; color: #f5f5f0; }
        body {
            display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px;
            font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;
        }
        .card {
            width: 100%; max-width: 28rem; background: #0a2530; border: 1px solid #1e4050;
            border-radius: 12px; padding: 32px 24px; text-align: center;
        }
        .badge {
            width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 999px; background: rgba(175, 154, 79, .2);
            display: flex; align-items: center; justify-content: center; color: #af9a4f; font-size: 28px;
        }
        .code { font-family: Bitter, Georgia, serif; font-size: 48px; font-weight: 700; color: #af9a4f; margin: 0; }
        h1 { font-family: Bitter, Georgia, serif; font-size: 24px; font-weight: 600; margin: 8px 0 12px; }
        p.msg { color: #8a9a9f; margin: 0 0 24px; }
        .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
        .btn {
            display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 6px;
            font-size: 14px; font-weight: 500; text-decoration: none; cursor: pointer; border: 1px solid #af9a4f;
            font-family: inherit;
        }
        .btn-primary { background: #af9a4f; color: #02141b; }
        .btn-outline { background: transparent; color: #f5f5f0; border-color: #1e4050; }
        .btn:focus-visible { outline: 2px solid #af9a4f; outline-offset: 2px; }
    </style>
</head>
<body>
    <main class="card">
        <div class="badge" aria-hidden="true">@yield('icon', '!')</div>
        <p class="code" aria-hidden="true">@yield('code')</p>
        <h1>@yield('title')</h1>
        <p class="msg">@yield('message')</p>
        <div class="actions">
            @hasSection('reload')
                <button type="button" class="btn btn-primary" onclick="window.location.reload()">Recargar la página</button>
                <a class="btn btn-outline" href="/">Ir al inicio</a>
            @else
                <button type="button" class="btn btn-outline" onclick="window.history.back()">Volver atrás</button>
                <a class="btn btn-primary" href="/">Ir al inicio</a>
            @endif
        </div>
    </main>
</body>
</html>
