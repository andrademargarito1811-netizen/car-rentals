<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Car;
use App\Models\ContactMessage;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    private const PERIODS = ['today', '7d', '30d', '90d', 'all'];

    public function index(Request $request)
    {
        $today = Carbon::today();
        $period = $this->resolvePeriod($request);
        $since = $this->periodStart($period, $today);

        $revenueTrend = $this->revenueTrend($period, $since, $today);

        $bookingStatusBreakdown = Booking::when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => $r->count]);

        $upcomingPickups = Booking::with(['user', 'guest', 'car'])
            ->whereDate('start_date', $today)
            ->whereIn('status', ['confirmed', 'active'])
            ->latest()
            ->take(10)
            ->get();

        $upcomingReturns = Booking::with(['user', 'guest', 'car'])
            ->whereDate('end_date', $today)
            ->whereIn('status', ['confirmed', 'active'])
            ->latest()
            ->take(10)
            ->get();

        $topRentedCars = Car::withCount(['bookings' => fn ($q) => $q->when($since, fn ($sq) => $sq->where('created_at', '>=', $since))])
            ->orderBy('bookings_count', 'desc')
            ->take(5)
            ->get()
            ->map(fn ($car) => [
                'id' => $car->id,
                'brand' => $car->brand,
                'model' => $car->model,
                'image_path' => $car->image_path,
                'bookings_count' => $car->bookings_count,
                'daily_rate' => (float) $car->daily_rate,
            ]);

        $revenueByLocation = Booking::join('payments', 'bookings.id', '=', 'payments.booking_id')
            ->leftJoin('tblvehicle_location', 'bookings.pickup_location_id', '=', 'tblvehicle_location.location_id')
            ->where('payments.payment_status', 'completed')
            ->when($since, fn ($q) => $q->where('bookings.created_at', '>=', $since))
            ->selectRaw("COALESCE(NULLIF(tblvehicle_location.location, ''), 'Unknown') as location, SUM(payments.amount) as revenue")
            ->groupByRaw("COALESCE(NULLIF(tblvehicle_location.location, ''), 'Unknown')")
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => ['location' => $r->location, 'revenue' => (float) $r->revenue]);

        $unreadMessages = ContactMessage::where('is_read', false)->count();

        $overdueBookings = Booking::whereIn('status', ['confirmed', 'active'])
            ->whereDate('end_date', '<', $today)
            ->count();

        $heatmapData = Booking::where('start_date', '>=', $today->copy()->subDays(30))
            ->whereIn('status', ['confirmed', 'active'])
            ->get(['start_date'])
            ->groupBy(fn ($b) => $b->start_date->toDateString())
            ->map(fn ($group, $date) => ['date' => $date, 'count' => $group->count()])
            ->values();

        // Fleet status vs. actually free to rent today.
        $availableCars = Car::available()->count();
        $availableForRent = Car::available()
            ->whereDoesntHave('bookings', function ($q) use ($today) {
                $q->whereIn('status', ['confirmed', 'active'])
                    ->whereDate('start_date', '<=', $today)
                    ->whereDate('end_date', '>=', $today);
            })
            ->count();

        $stats = [
            'period' => $period,
            'total_cars' => Car::count(),
            'available_cars' => $availableCars,
            'available_for_rent' => $availableForRent,
            'rented_cars' => Car::whereHas('bookings', fn ($q) => $q->active())->count(),
            'total_bookings' => Booking::when($since, fn ($q) => $q->where('created_at', '>=', $since))->count(),
            'active_bookings' => Booking::active()->when($since, fn ($q) => $q->where('created_at', '>=', $since))->count(),
            'total_users' => User::count(),
            'total_guests' => Guest::count(),
            'recent_bookings' => Booking::with(['user', 'guest', 'car'])
                ->latest()
                ->take(10)
                ->get(),
            'revenue' => $this->revenue($since),
            'revenue_trend' => $revenueTrend,
            'booking_status_breakdown' => $bookingStatusBreakdown,
            'upcoming_pickups' => $upcomingPickups,
            'upcoming_returns' => $upcomingReturns,
            'top_rented_cars' => $topRentedCars,
            'revenue_by_location' => $revenueByLocation,
            'unread_messages' => $unreadMessages,
            'overdue_bookings' => $overdueBookings,
            'heatmap_data' => $heatmapData,
        ];

        return Inertia::render('admin_panel/Dashboard', $stats);
    }

    public function export(Request $request)
    {
        $today = Carbon::today();
        $period = $this->resolvePeriod($request);
        $since = $this->periodStart($period, $today);

        $data = [
            'date' => $today->format('F j, Y'),
            'total_cars' => Car::count(),
            'available_cars' => Car::available()->count(),
            'rented_cars' => Car::whereHas('bookings', fn ($q) => $q->active())->count(),
            'total_bookings' => Booking::when($since, fn ($q) => $q->where('created_at', '>=', $since))->count(),
            'active_bookings' => Booking::active()->when($since, fn ($q) => $q->where('created_at', '>=', $since))->count(),
            'total_users' => User::count(),
            'total_guests' => Guest::count(),
            'revenue' => $this->revenue($since),
            'recent_bookings' => Booking::with(['user', 'guest', 'car'])
                ->latest()->take(20)->get(),
            'revenue_by_location' => Booking::join('payments', 'bookings.id', '=', 'payments.booking_id')
                ->leftJoin('tblvehicle_location', 'bookings.pickup_location_id', '=', 'tblvehicle_location.location_id')
                ->where('payments.payment_status', 'completed')
                ->when($since, fn ($q) => $q->where('bookings.created_at', '>=', $since))
                ->selectRaw("COALESCE(NULLIF(tblvehicle_location.location, ''), 'Unknown') as location, SUM(payments.amount) as revenue")
                ->groupByRaw("COALESCE(NULLIF(tblvehicle_location.location, ''), 'Unknown')")
                ->orderByDesc('revenue')
                ->get(),
            'booking_status_breakdown' => Booking::when($since, fn ($q) => $q->where('created_at', '>=', $since))
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')->get(),
        ];

        return view('admin.dashboard-export', $data);
    }

    private function resolvePeriod(Request $request): string
    {
        $period = $request->get('period', '30d');

        return in_array($period, self::PERIODS, true) ? $period : '30d';
    }

    private function periodStart(string $period, Carbon $today): ?Carbon
    {
        return match ($period) {
            'today' => $today->copy()->startOfDay(),
            '7d' => $today->copy()->subDays(7),
            '30d' => $today->copy()->subDays(30),
            '90d' => $today->copy()->subDays(90),
            default => null,
        };
    }

    private function revenue(?Carbon $since): float
    {
        return round((float) Payment::where('payment_status', 'completed')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->sum('amount'), 2);
    }

    private function revenueTrend(string $period, ?Carbon $since, Carbon $today): array
    {
        $payments = Payment::where('payment_status', 'completed')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))
            ->orderBy('created_at')
            ->get(['created_at', 'amount']);

        [$bucket, $label, $step] = $this->trendConfig($period);

        $buckets = [];
        foreach ($payments as $p) {
            $key = $bucket(Carbon::parse($p->created_at))->toIso8601String();
            $buckets[$key] = ($buckets[$key] ?? 0) + (float) $p->amount;
        }

        $first = $payments->first();
        $start = $since
            ? $bucket($since)
            : $bucket($first ? Carbon::parse($first->created_at) : $today->copy()->subMonths(12));
        $endBucket = $bucket($period === 'today' ? Carbon::now() : $today);

        $result = [];
        $cursor = $start;
        $guard = 0;

        while ($cursor->lte($endBucket) && $guard < 600) {
            $result[] = [
                'month' => $label($cursor),
                'revenue' => round($buckets[$cursor->toIso8601String()] ?? 0, 2),
            ];
            $step($cursor);
            $guard++;
        }

        return $result;
    }

    private function trendConfig(string $period): array
    {
        return match ($period) {
            'today' => [
                fn (Carbon $d) => $d->copy()->startOfHour(),
                fn (Carbon $d) => $d->format('g A'),
                fn (Carbon $d) => $d->addHour(),
            ],
            '7d' => [
                fn (Carbon $d) => $d->copy()->startOfDay(),
                fn (Carbon $d) => $d->format('D j'),
                fn (Carbon $d) => $d->addDay(),
            ],
            '30d' => [
                fn (Carbon $d) => $d->copy()->startOfDay(),
                fn (Carbon $d) => $d->format('M j'),
                fn (Carbon $d) => $d->addDay(),
            ],
            '90d' => [
                fn (Carbon $d) => $d->copy()->startOfWeek(),
                fn (Carbon $d) => 'Wk '.$d->format('M j'),
                fn (Carbon $d) => $d->addWeek(),
            ],
            default => [
                fn (Carbon $d) => $d->copy()->startOfMonth(),
                fn (Carbon $d) => $d->format('M y'),
                fn (Carbon $d) => $d->addMonth(),
            ],
        };
    }
}
