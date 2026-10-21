<?php

namespace Tests\Feature;

use App\Models\Entrenamiento;
use App\Models\Habilidad;
use App\Models\Permission;
use App\Models\Reto;
use App\Models\RetoSemana;
use App\Models\Revision;
use App\Models\Role;
use App\Models\User;
use App\Support\Permissions;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Retos liberados por partes: Entrenar (`retos.entrenar`), el árbol
 * (`retos.arbol`) y Revisiones y Personas (`retos.revisar`). El admin ve todo.
 */
class RetosPermisosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // 15:00 en Colombia.
        $this->travelTo(CarbonImmutable::parse('2026-11-02 20:00:00', 'UTC'));
    }

    /** Una persona con un rol que tiene esos permisos. */
    private function userWith(string ...$permissions): User
    {
        $slug = 'rol-'.implode('-', array_map(fn (string $p) => str_replace('.', '-', $p), $permissions));
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => $slug]);
        $role->permissions()->sync(Permission::whereIn('slug', $permissions)->pluck('id'));

        return User::factory()->withRole($slug)->create();
    }

    private function suelto(): Reto
    {
        return Reto::where('kind', Reto::SUELTO)->orderBy('sort_order')->firstOrFail();
    }

    private function skill(string $slug): Habilidad
    {
        return Habilidad::where('slug', $slug)->firstOrFail();
    }

    private function reto(string $slug, string $kind = Reto::PRACTICA): Reto
    {
        return $this->skill($slug)->retos()->where('kind', $kind)->firstOrFail();
    }

    /** Una semana de ese reto ya terminada, con 4 días entrenados (bronce). */
    private function finishedWeek(User $user, Reto $reto): RetoSemana
    {
        $start = CarbonImmutable::parse('2026-10-20');
        $week = RetoSemana::create([
            'user_id' => $user->id, 'reto_id' => $reto->id,
            'starts_on' => $start, 'ends_on' => $start->addDays(6),
        ]);
        foreach (range(0, 3) as $d) {
            Entrenamiento::create([
                'user_id' => $user->id, 'reto_id' => $reto->id, 'reto_semana_id' => $week->id,
                'duration_seconds' => 60, 'started_at' => $start->addDays($d),
                'completed_at' => $start->addDays($d), 'completed_on' => $start->addDays($d),
            ]);
        }

        return $week;
    }

    // ── Entrenar ────────────────────────────────────────────────────

    public function test_con_entrenar_ve_y_hace_solo_los_retos_de_entrenar(): void
    {
        $this->actingAs($this->userWith(Permissions::RETOS_ENTRENAR));

        $this->get('/retos')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('retos/index')
            ->has('sueltos', 5)
            // Nada del árbol viaja al navegador.
            ->where('frontier', null)
            ->where('progress', null)
            ->where('pending_reviews', 0)
            ->where('demo', null)
            ->where('today', '2026-11-02'));

        $this->post("/retos/{$this->suelto()->id}/semana")->assertRedirect();
        $this->assertSame(1, RetoSemana::count());

        // Los retos del árbol y las otras pestañas, no.
        $this->post("/retos/{$this->reto('ginga')->id}/semana")->assertForbidden();
        $this->get("/retos/{$this->reto('ginga')->id}/entrenar")->assertForbidden();
        $this->post("/retos/{$this->reto('ginga', Reto::SECRETO)->id}/entrenar")->assertForbidden();
        $this->get('/retos/arbol')->assertForbidden();
        $this->post("/retos/habilidades/{$this->skill('ginga')->id}/revision")->assertForbidden();
        $this->get('/retos/revisiones')->assertForbidden();
        $this->get('/retos/personas')->assertForbidden();
        $this->post('/retos/demo/dia-siguiente')->assertForbidden();
        $this->post('/retos/demo/reiniciar')->assertForbidden();
        $this->assertSame(1, RetoSemana::count());
    }

    public function test_con_entrenar_el_inicio_y_el_perfil_muestran_solo_entrenar(): void
    {
        $user = $this->userWith(Permissions::RETOS_ENTRENAR);
        $this->actingAs($user);
        $this->post("/retos/{$this->suelto()->id}/semana");
        // Una semana del árbol (de cuando tenía el permiso, por ejemplo).
        RetoSemana::create([
            'user_id' => $user->id, 'reto_id' => $this->reto('ginga')->id,
            'starts_on' => '2026-11-01', 'ends_on' => '2026-11-07',
        ]);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->has('retos.active', 1)
            ->where('retos.active.0.reto.kind', Reto::SUELTO)
            ->where('retos.progress', null));

        $this->get('/retos')->assertInertia(fn (Assert $page) => $page->has('active', 1));

        $this->get('/perfil')->assertInertia(fn (Assert $page) => $page
            ->has('medallas', 5)
            ->where('medallas.0.group', 'sueltos'));
    }

    public function test_no_celebra_lo_del_arbol_sin_su_permiso_y_lo_deja_para_despues(): void
    {
        $user = $this->userWith(Permissions::RETOS_ENTRENAR);
        $suelto = $this->finishedWeek($user, $this->suelto());
        $practica = $this->finishedWeek($user, $this->reto('ginga'));
        $this->actingAs($user);

        $this->get('/retos')->assertInertia(fn (Assert $page) => $page
            ->has('celebrations', 1)
            ->where('celebrations.0.habilidad', null)
            ->has('finished', 1));

        $this->assertNotNull($suelto->fresh()?->celebrated_at);
        $this->assertNull($practica->fresh()?->celebrated_at);
    }

    // ── Árbol ───────────────────────────────────────────────────────

    public function test_con_el_arbol_no_ve_los_retos_de_entrenar(): void
    {
        $this->actingAs($this->userWith(Permissions::RETOS_ARBOL));

        $this->get('/retos')->assertInertia(fn (Assert $page) => $page
            ->where('sueltos', null)
            ->has('frontier', 2)
            ->has('progress'));
        $this->get('/retos/arbol')->assertOk();

        $this->post("/retos/{$this->suelto()->id}/semana")->assertForbidden();
        $this->post("/retos/{$this->reto('ginga')->id}/semana")->assertRedirect();
        $this->get('/retos/revisiones')->assertForbidden();
        $this->get('/perfil')->assertInertia(fn (Assert $page) => $page
            ->where('medallas', fn ($m) => collect($m)->every(fn ($r) => $r['group'] !== 'sueltos')));
    }

    // ── Revisiones y personas ───────────────────────────────────────

    public function test_quien_solo_revisa_va_directo_a_las_revisiones(): void
    {
        $this->actingAs($this->userWith(Permissions::RETOS_REVISAR));

        $this->get('/retos')->assertRedirect('/retos/revisiones');
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('retos', null));
    }

    public function test_sin_ningun_permiso_no_hay_retos(): void
    {
        $this->actingAsRole('member');

        $this->get('/retos')->assertForbidden();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('retos', null));
        $this->get('/perfil')->assertInertia(fn (Assert $page) => $page->where('medallas', null));
    }

    public function test_quien_revisa_ve_y_marca_solo_a_otras_personas_con_el_arbol(): void
    {
        $reviewer = $this->userWith(Permissions::RETOS_REVISAR, Permissions::RETOS_ARBOL);
        $alumno = $this->userWith(Permissions::RETOS_ARBOL);
        $sinArbol = $this->userWith(Permissions::RETOS_ENTRENAR);
        $admin = User::factory()->admin()->create();
        $ginga = $this->skill('ginga');
        $this->actingAs($reviewer);

        $this->get('/retos/personas')->assertInertia(fn (Assert $page) => $page
            ->where('people', fn ($people) => collect($people)->pluck('id')->sort()->values()->all()
                === collect([$alumno->id, $admin->id])->sort()->values()->all()));

        $this->get("/retos/personas/{$alumno->id}")->assertOk();
        $this->post("/retos/personas/{$alumno->id}/habilidades/{$ginga->id}")->assertRedirect();
        $this->assertSame(1, $alumno->habilidadesDominadas()->count());

        // Ni su propio árbol ni el de quien no tiene el árbol.
        foreach ([$reviewer, $sinArbol] as $person) {
            $this->get("/retos/personas/{$person->id}")->assertForbidden();
            $this->post("/retos/personas/{$person->id}/habilidades/{$ginga->id}")->assertForbidden();
            $this->delete("/retos/personas/{$person->id}/habilidades/{$ginga->id}")->assertForbidden();
            $this->assertSame(0, $person->habilidadesDominadas()->count());
        }
    }

    public function test_quien_revisa_no_responde_sus_propios_pedidos(): void
    {
        $reviewer = $this->userWith(Permissions::RETOS_REVISAR, Permissions::RETOS_ARBOL);
        $alumno = $this->userWith(Permissions::RETOS_ARBOL);
        $ginga = $this->skill('ginga');
        $own = Revision::create(['user_id' => $reviewer->id, 'habilidad_id' => $ginga->id, 'status' => Revision::PENDIENTE]);
        $other = Revision::create(['user_id' => $alumno->id, 'habilidad_id' => $ginga->id, 'status' => Revision::PENDIENTE]);
        $this->actingAs($reviewer);

        $this->get('/retos/revisiones')->assertInertia(fn (Assert $page) => $page
            ->has('pending', 1)
            ->where('pending.0.id', $other->id)
            ->where('pending_reviews', 1));

        $this->post("/retos/revisiones/{$own->id}/aprobar")->assertForbidden();
        $this->post("/retos/revisiones/{$own->id}/rechazar", ['comment' => 'No'])->assertForbidden();
        $this->assertSame(Revision::PENDIENTE, $own->fresh()?->status);

        $this->post("/retos/revisiones/{$other->id}/aprobar")->assertRedirect();
        $this->assertSame(Revision::APROBADA, $other->fresh()?->status);
    }

    public function test_el_admin_ve_a_todas_las_personas_y_sus_propios_pedidos(): void
    {
        $admin = $this->actingAsRole('admin');
        $member = User::factory()->create();
        Revision::create(['user_id' => $admin->id, 'habilidad_id' => $this->skill('ginga')->id, 'status' => Revision::PENDIENTE]);

        $this->get('/retos/personas')->assertInertia(fn (Assert $page) => $page
            ->where('people', fn ($people) => collect($people)->pluck('id')->contains($member->id)
                && collect($people)->pluck('id')->contains($admin->id)));
        $this->get("/retos/personas/{$member->id}")->assertOk();
        $this->get('/retos/revisiones')->assertInertia(fn (Assert $page) => $page->has('pending', 1));
    }

    // ── Controles de prueba ─────────────────────────────────────────

    public function test_los_controles_de_prueba_no_valen_para_quien_no_es_admin(): void
    {
        $this->actingAs($this->userWith(Permissions::RETOS_ENTRENAR));

        // Aunque la sesión tenga días simulados guardados, "hoy" es hoy.
        $this->withSession(['retos_demo.offset' => 5, 'retos_demo.fast' => true])
            ->get('/retos')
            ->assertInertia(fn (Assert $page) => $page->where('today', '2026-11-02')->where('demo', null));

        $reto = $this->suelto();
        $this->post("/retos/{$reto->id}/semana");
        $this->post("/retos/{$reto->id}/entrenar");
        $this->assertSame($reto->totalSeconds(), Entrenamiento::firstOrFail()->duration_seconds);
    }
}
