<?php

namespace Tests\Feature;

use App\Models\Evento;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Calendario de eventos (fase 9). */
class EventosTest extends TestCase
{
    use RefreshDatabase;

    private array $valid = [
        'title' => 'Clase de Angola',
        'description' => 'Traer instrumentos',
        'location' => 'Academia',
        'starts_on' => '2026-11-03',
        'ends_on' => '2026-12-15',
        'start_time' => '18:00',
        'end_time' => '20:00',
        'repeat_days' => [2, 4],
    ];

    /** @return list<string> */
    private function datesOf(array $calendar, string $eventId): array
    {
        return array_values(array_map(
            fn (array $o) => $o['date'],
            array_filter($calendar['occurrences'], fn (array $o) => $o['event_id'] === $eventId),
        ));
    }

    private function calendar(string $url): array
    {
        return $this->get($url)->assertOk()->viewData('page')['props']['calendar'];
    }

    // ── Ver ─────────────────────────────────────────────────────────

    public function test_cualquier_sesion_ve_el_calendario_y_sin_sesion_no(): void
    {
        $this->get('/eventos')->assertRedirect('/auth/login');

        $this->actingAsRole('member');
        $this->get('/eventos')->assertOk()->assertInertia(fn (Assert $page) => $page->component('eventos'));
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('home')->has('calendar.events'));
    }

    public function test_la_vista_de_mes_cubre_semanas_completas_de_lunes_a_domingo(): void
    {
        $this->actingAsRole('member');

        $cal = $this->calendar('/eventos?vista=mes&fecha=2026-11-20');

        $this->assertSame('mes', $cal['view']);
        $this->assertSame('2026-10-26', $cal['from']); // lunes
        $this->assertSame('2026-12-06', $cal['to']);   // domingo
    }

    public function test_la_vista_de_semana_va_de_lunes_a_domingo(): void
    {
        $this->actingAsRole('member');

        $cal = $this->calendar('/eventos?vista=semana&fecha=2026-11-05');

        $this->assertSame('2026-11-02', $cal['from']);
        $this->assertSame('2026-11-08', $cal['to']);
    }

    public function test_una_fecha_invalida_se_toma_como_hoy_en_colombia(): void
    {
        $this->actingAsRole('member');
        // 02:00 UTC del 16 = todavía 15 en Colombia (UTC-5).
        $this->travelTo(CarbonImmutable::parse('2026-10-16 02:00:00', 'UTC'));

        foreach (['/eventos?fecha=2026-02-31', '/eventos?fecha=hola', '/eventos'] as $url) {
            $cal = $this->calendar($url);
            $this->assertSame('2026-10-15', $cal['date'], $url);
            $this->assertSame('2026-10-15', $cal['today'], $url);
        }
    }

    public function test_un_evento_recurrente_aparece_en_sus_dias_dentro_del_rango(): void
    {
        $this->actingAsRole('member');
        $e = Evento::factory()->create([
            'starts_on' => '2026-11-03', 'ends_on' => '2026-11-12', 'repeat_days' => [2, 4],
        ]);

        $cal = $this->calendar('/eventos?vista=mes&fecha=2026-11-01');

        // Martes y jueves entre el 3 y el 12 de noviembre.
        $this->assertSame(['2026-11-03', '2026-11-05', '2026-11-10', '2026-11-12'], $this->datesOf($cal, $e->id));
    }

    public function test_un_evento_de_varios_dias_aparece_cada_dia_aunque_empiece_antes_del_rango(): void
    {
        $this->actingAsRole('member');
        $e = Evento::factory()->create(['starts_on' => '2026-10-30', 'ends_on' => '2026-11-03']);

        $cal = $this->calendar('/eventos?vista=semana&fecha=2026-11-02');

        $this->assertSame(['2026-11-02', '2026-11-03'], $this->datesOf($cal, $e->id));
    }

    public function test_los_eventos_fuera_del_rango_no_se_envian(): void
    {
        $this->actingAsRole('member');
        Evento::factory()->create(['starts_on' => '2026-09-01']);
        // Recurrente que cruza la semana pero sin días dentro de ella.
        Evento::factory()->create(['starts_on' => '2026-11-01', 'ends_on' => '2026-11-30', 'repeat_days' => [6]]);

        $cal = $this->calendar('/eventos?vista=semana&fecha=2026-11-02');

        // La semana 2 al 8 incluye el sábado 7: solo ese aparece.
        $this->assertCount(1, $cal['events']);
        $this->assertSame(['2026-11-07'], array_column($cal['occurrences'], 'date'));

        $cal = $this->calendar('/eventos?vista=semana&fecha=2026-12-07');
        $this->assertSame([], $cal['events']);
    }

    public function test_dentro_del_dia_primero_todo_el_dia_y_despues_por_hora(): void
    {
        $this->actingAsRole('member');
        $tarde = Evento::factory()->create(['start_time' => '18:00']);
        $manana = Evento::factory()->create(['start_time' => '08:30']);
        $todoElDia = Evento::factory()->create();

        $cal = $this->calendar('/eventos?vista=semana&fecha=2026-11-10');

        $this->assertSame([$todoElDia->id, $manana->id, $tarde->id], array_column($cal['occurrences'], 'event_id'));
    }

    // ── Crear, editar, eliminar ─────────────────────────────────────

    public function test_un_miembro_no_puede_crear_eventos(): void
    {
        $this->actingAsRole('member');

        $this->post('/eventos', $this->valid)->assertForbidden();
        $this->assertDatabaseCount('eventos', 0);
    }

    public function test_un_profesor_crea_un_evento_recurrente(): void
    {
        $profe = $this->actingAsRole('profesor');

        $this->post('/eventos', $this->valid)->assertSessionHasNoErrors();

        $e = Evento::firstOrFail();
        $this->assertSame($profe->id, $e->user_id);
        $this->assertSame([2, 4], $e->repeat_days);
        $this->assertSame('18:00:00', $e->start_time);
        $this->assertSame('2026-12-15', $e->ends_on->toDateString());
    }

    public function test_un_evento_de_todo_el_dia_y_de_un_solo_dia(): void
    {
        $this->actingAsRole('profesor');

        $this->post('/eventos', [
            'title' => 'Batizado', 'starts_on' => '2026-11-21', 'ends_on' => '2026-11-21',
            'start_time' => null, 'end_time' => '20:00', 'repeat_days' => [],
        ])->assertSessionHasErrors('start_time');

        $this->post('/eventos', [
            'title' => 'Batizado', 'starts_on' => '2026-11-21', 'ends_on' => '2026-11-21', 'repeat_days' => [],
        ])->assertSessionHasNoErrors();

        $e = Evento::firstOrFail();
        $this->assertNull($e->ends_on);
        $this->assertNull($e->start_time);
        $this->assertNull($e->repeat_days);
    }

    public function test_valida_fechas_horas_y_dias(): void
    {
        $this->actingAsRole('profesor');

        $this->post('/eventos', [...$this->valid, 'title' => ''])->assertSessionHasErrors(['title' => 'El título es obligatorio']);
        $this->post('/eventos', [...$this->valid, 'ends_on' => '2026-11-01'])
            ->assertSessionHasErrors(['ends_on' => 'La fecha de fin no puede ser anterior a la de inicio']);
        $this->post('/eventos', [...$this->valid, 'ends_on' => null])
            ->assertSessionHasErrors(['ends_on' => 'Un evento que se repite necesita fecha de fin']);
        $this->post('/eventos', [...$this->valid, 'end_time' => '17:00'])
            ->assertSessionHasErrors(['end_time' => 'La hora de fin tiene que ser posterior a la de inicio']);
        $this->post('/eventos', [...$this->valid, 'repeat_days' => [8]])->assertSessionHasErrors('repeat_days.0');
        $this->post('/eventos', [...$this->valid, 'ends_on' => '2027-11-04'])
            ->assertSessionHasErrors(['ends_on' => 'El evento puede durar como máximo un año']);
        // Martes 3 al miércoles 4: ningún sábado.
        $this->post('/eventos', [...$this->valid, 'ends_on' => '2026-11-04', 'repeat_days' => [6]])
            ->assertSessionHasErrors(['repeat_days' => 'Ninguno de los días elegidos cae entre las dos fechas']);
        $this->post('/eventos', [...$this->valid, 'starts_on' => '2026-02-31'])->assertSessionHasErrors('starts_on');

        $this->assertDatabaseCount('eventos', 0);
    }

    public function test_cada_profesor_edita_y_elimina_solo_los_suyos(): void
    {
        $profe = $this->actingAsRole('profesor');
        $otro = User::factory()->withRole('profesor')->create();
        $mio = Evento::factory()->create(['user_id' => $profe->id]);
        $ajeno = Evento::factory()->create(['user_id' => $otro->id, 'title' => 'Ajeno']);

        $this->put("/eventos/{$mio->id}", [...$this->valid, 'title' => 'Editado'])->assertSessionHasNoErrors();
        $this->assertSame('Editado', $mio->fresh()->title);

        $this->put("/eventos/{$ajeno->id}", $this->valid)->assertForbidden();
        $this->delete("/eventos/{$ajeno->id}")->assertForbidden();
        $this->assertSame('Ajeno', $ajeno->fresh()->title);

        $this->delete("/eventos/{$mio->id}")->assertSessionHasNoErrors();
        $this->assertNull($mio->fresh());
    }

    public function test_sin_el_permiso_no_edita_ni_sus_propios_eventos(): void
    {
        $user = $this->actingAsRole('member');
        $e = Evento::factory()->create(['user_id' => $user->id]);

        $this->put("/eventos/{$e->id}", $this->valid)->assertForbidden();
        $this->delete("/eventos/{$e->id}")->assertForbidden();
    }

    public function test_el_admin_edita_y_elimina_cualquiera(): void
    {
        $this->actingAsRole('admin');
        $e = Evento::factory()->create(['user_id' => User::factory()->withRole('profesor')->create()->id]);

        $this->put("/eventos/{$e->id}", [...$this->valid, 'title' => 'Por admin'])->assertSessionHasNoErrors();
        $this->assertSame('Por admin', $e->fresh()->title);

        $this->delete("/eventos/{$e->id}")->assertSessionHasNoErrors();
        $this->assertNull($e->fresh());
    }

    public function test_el_calendario_dice_quien_puede_editar_cada_evento(): void
    {
        $profe = $this->actingAsRole('profesor', ['apodo' => 'Gavião']);
        Evento::factory()->create(['user_id' => $profe->id, 'title' => 'Mío']);
        Evento::factory()->create(['user_id' => User::factory()->create()->id, 'title' => 'Ajeno']);

        $events = collect($this->calendar('/eventos?fecha=2026-11-10')['events'])->keyBy('title');

        $this->assertTrue($events['Mío']['can_edit']);
        $this->assertSame('Gavião', $events['Mío']['author']);
        $this->assertFalse($events['Ajeno']['can_edit']);
    }

    public function test_si_se_elimina_a_quien_lo_creo_el_evento_queda(): void
    {
        $profe = User::factory()->withRole('profesor')->create();
        $e = Evento::factory()->create(['user_id' => $profe->id]);

        $profe->delete();

        $this->assertNull($e->fresh()->user_id);
    }

    public function test_editar_un_evento_inexistente_da_404(): void
    {
        $this->actingAsRole('admin');

        $this->put('/eventos/00000000-0000-0000-0000-000000000000', $this->valid)->assertNotFound();
    }
}
