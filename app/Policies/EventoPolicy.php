<?php

namespace App\Policies;

use App\Models\Evento;
use App\Models\User;
use App\Support\Permissions;

/**
 * Eventos del calendario: verlos, cualquier sesión; crearlos, el permiso
 * `eventos.gestionar`; editar y eliminar, solo los propios y teniendo el
 * permiso. El admin puede con todos (Gate::before en AppServiceProvider).
 */
class EventoPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::EVENTOS_GESTIONAR);
    }

    public function update(User $user, Evento $evento): bool
    {
        return $this->create($user) && $evento->user_id === $user->id;
    }

    public function delete(User $user, Evento $evento): bool
    {
        return $this->update($user, $evento);
    }
}
