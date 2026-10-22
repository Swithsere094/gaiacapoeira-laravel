<!DOCTYPE html>
{{--
    Página pública de un evento de la prueba de concepto de subdominios
    ({slug}.gaiacapoeira.com). HTML simple con estilos en línea, mismos
    colores que el sitio. Más adelante será la página de registro al evento.
--}}
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>Evento: {{ $evento->nombre }} - Areia no Mar</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; background: #02141b; color: #f5f5f0; }
        body {
            display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 16px;
            font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;
        }
        .card {
            width: 100%; max-width: 32rem; background: #0a2530; border: 1px solid #1e4050;
            border-radius: 12px; padding: 32px 24px; text-align: center;
        }
        .label { color: #af9a4f; font-size: 14px; letter-spacing: .08em; text-transform: uppercase; margin: 0; }
        h1 { font-family: Bitter, Georgia, serif; font-size: 28px; font-weight: 700; margin: 8px 0 0; overflow-wrap: anywhere; }
    </style>
</head>
<body>
    <main class="card">
        <p class="label">Evento</p>
        <h1>Evento: {{ $evento->nombre }}</h1>
    </main>
</body>
</html>
