<?php

namespace App\Support;

/**
 * Catálogo de permisos que revisa el código. Cada uno se asigna a los roles
 * desde Gestión de Roles (tabla `permission_role`); el rol admin los tiene
 * todos siempre.
 *
 * Un permiso solo sirve si hay código que lo revise, así que se agregan acá
 * y en una migración que inserte su fila en `permissions` (con su nombre y
 * descripción para la pantalla de roles). tests/Feature/RolesTest.php
 * verifica que esta lista y la tabla coincidan.
 *
 * Gestionar usuarios y roles no es un permiso: queda solo para admin, así
 * nadie puede darse a sí mismo más permisos.
 */
final class Permissions
{
    public const ANALITICAS_VER = 'analiticas.ver';

    public const GALERA_GESTIONAR = 'galera.gestionar';

    public const POLITICA_GESTIONAR = 'politica.gestionar';

    public const CANCIONES_ELIMINAR = 'canciones.eliminar';

    public const CANCIONES_NOSSA = 'canciones.nossa';

    /** Crear eventos; editar y eliminar los propios (EventoPolicy). */
    public const EVENTOS_GESTIONAR = 'eventos.gestionar';

    /** Retos de la sección Entrenar (flexibilidad, fuerza…) y sus medallas. */
    public const RETOS_ENTRENAR = 'retos.entrenar';

    /** El árbol de habilidades: sus retos, el secreto y pedir revisión. */
    public const RETOS_ARBOL = 'retos.arbol';

    /** Revisiones y Personas (nunca sobre el árbol propio, salvo el admin). */
    public const RETOS_REVISAR = 'retos.revisar';

    public const ALL = [
        self::ANALITICAS_VER,
        self::GALERA_GESTIONAR,
        self::POLITICA_GESTIONAR,
        self::CANCIONES_ELIMINAR,
        self::CANCIONES_NOSSA,
        self::EVENTOS_GESTIONAR,
        self::RETOS_ENTRENAR,
        self::RETOS_ARBOL,
        self::RETOS_REVISAR,
    ];
}
