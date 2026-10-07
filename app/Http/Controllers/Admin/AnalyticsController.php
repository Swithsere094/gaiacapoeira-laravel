<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Panel de analíticas propias (solo admin). */
class AnalyticsController extends Controller
{
    private const DAYS = 30;

    public function index(): Response
    {
        $totals = PageView::query()
            ->selectRaw('count(*) as views, count(distinct user_id) as users')
            ->first();

        $topPages = PageView::query()
            ->select('path', DB::raw('count(*) as count'))
            ->groupBy('path')
            ->orderByDesc('count')
            ->limit(15)
            ->get()
            ->map(fn ($row) => ['path' => $row->path, 'count' => (int) $row->getAttribute('count')]);

        return Inertia::render('admin/analytics', [
            'summary' => [
                'totalViews' => (int) ($totals?->getAttribute('views') ?? 0),
                'uniqueUsers' => (int) ($totals?->getAttribute('users') ?? 0),
                'topPages' => $topPages,
                'viewsByDay' => $this->viewsByDay(),
            ],
        ]);
    }

    /**
     * Visitas por día de los últimos 30 días (incluye días sin visitas).
     *
     * El día se calcula acá en PHP, en UTC, y no con DATE() de MySQL: el
     * huso horario de la sesión de MySQL puede no ser UTC y mandar una visita
     * al día equivocado (gotcha heredado del sitio anterior, ver CLAUDE.md).
     * Las filas y la lista de referencia usan la misma conversión.
     *
     * @return list<array{day: string, count: int}>
     */
    private function viewsByDay(): array
    {
        $today = CarbonImmutable::now('UTC')->startOfDay();
        $since = $today->subDays(self::DAYS - 1);

        $counts = [];
        PageView::query()
            ->where('created_at', '>=', $since)
            ->pluck('created_at')
            ->each(function ($createdAt) use (&$counts) {
                $day = CarbonImmutable::parse($createdAt)->utc()->format('Y-m-d');
                $counts[$day] = ($counts[$day] ?? 0) + 1;
            });

        $days = [];
        for ($i = self::DAYS - 1; $i >= 0; $i--) {
            $day = $today->subDays($i)->format('Y-m-d');
            $days[] = ['day' => $day, 'count' => $counts[$day] ?? 0];
        }

        return $days;
    }
}
