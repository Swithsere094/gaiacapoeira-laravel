<?php

namespace App\Support;

use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Qué parte de los retos ve cada persona (se liberan por partes, cada una con
 * su permiso; el admin ve todo):
 *
 *  - `retos.entrenar`: los retos de Entrenar (en la base, `kind = suelto`);
 *  - `retos.arbol`: el árbol, los retos de práctica y los secretos;
 *  - `retos.revisar`: Revisiones y Personas, nunca sobre el árbol propio
 *    (el admin sí puede: decisión del usuario).
 *
 * Lo que no le toca a alguien no viaja al navegador: los controladores
 * filtran con esto, no solo la pantalla.
 */
final class RetosAcceso
{
    public static function entrenar(User $user): bool
    {
        return $user->can(Permissions::RETOS_ENTRENAR);
    }

    public static function arbol(User $user): bool
    {
        return $user->can(Permissions::RETOS_ARBOL);
    }

    public static function revisar(User $user): bool
    {
        return $user->can(Permissions::RETOS_REVISAR);
    }

    /** Si tiene "Mis retos" (Entrenar o el árbol). */
    public static function misRetos(User $user): bool
    {
        return self::entrenar($user) || self::arbol($user);
    }

    /**
     * Tipos de reto que puede hacer.
     *
     * @return list<string>
     */
    public static function kinds(User $user): array
    {
        return [
            ...(self::entrenar($user) ? [Reto::SUELTO] : []),
            ...(self::arbol($user) ? [Reto::PRACTICA, Reto::SECRETO] : []),
        ];
    }

    public static function allows(User $user, Reto $reto): bool
    {
        return in_array($reto->kind, self::kinds($user), true);
    }

    /**
     * Semanas en curso de los retos que puede ver.
     *
     * @return Collection<int, RetoSemana>
     */
    public static function activeWeeks(Progreso $progreso): Collection
    {
        $kinds = self::kinds($progreso->user);

        return $progreso->activeWeeks()
            ->filter(fn (RetoSemana $s) => in_array($s->reto->kind, $kinds, true))
            ->values();
    }

    /**
     * Si `$reviewer` puede revisar o marcar el árbol de `$person`: el admin,
     * el de cualquiera (también el suyo); el resto, solo el de otras personas
     * que tengan el árbol.
     */
    public static function canReview(User $reviewer, User $person): bool
    {
        if ($reviewer->isAdmin()) {
            return true;
        }

        return self::revisar($reviewer)
            && $reviewer->id !== $person->id
            && self::arbol($person);
    }

    /**
     * Las personas cuyo árbol puede ver en Personas: el admin, todas (así
     * prepara los árboles antes de liberarlos); el resto, las que tienen el
     * árbol, menos sí misma.
     *
     * @return Builder<User>
     */
    public static function people(User $reviewer): Builder
    {
        $query = User::query();

        if ($reviewer->isAdmin()) {
            return $query;
        }

        return $query->whereKeyNot($reviewer->id)->whereHas('rol', fn (Builder $q) => $q
            ->where('slug', Role::ADMIN)
            ->orWhereHas('permissions', fn (Builder $p) => $p->where('slug', Permissions::RETOS_ARBOL)));
    }
}
