<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\Guest;
use App\Models\User;
use App\Models\Payment;
use App\Models\VehicleLocation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = Carbon::today();
        $monthsBack = min((int) $request->get('months_back', 12), 36);

        $revenueTrend = Payment::where('payment_status', 'completed')
            ->where('created_at', '>=', $today->copy()->subMonths($monthsBack))
            ->selectRaw('YEAR(created_at) as year, MONTH(created_at) as month, SUM(amount) as revenue')
            ->groupByRaw('YEAR(created_at), MONTH(created_at)')
            ->orderByRaw('YEAR(created_at), MONTH(created_at)')
            ->get()
            ->map(fn($r) => [
                'month' => Carbon::create($r->year, $r->month, 1)->format('M'),
                'revenue' => (float) $r->revenue,
            ]);

        $bookingStatusBreakdown = Booking::selectRaw('status, COUNT(*) as count')
            ->where('created_at', '>=', $today->copy()->subMonths($monthsBack))
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => $r->count]);

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

        $topRentedCars = Car::withCount(['bookings' => fn($q) => $q->where('created_at', '>=', $today->copy()->startOfMonth())])
            ->orderBy('bookings_count', 'desc')
            ->take(5)
            ->get()
            ->map(fn($car) => [
                'id' => $car->id,
                'brand' => $car->brand,
                'model' => $car->model,
                'image_path' => $car->image_path,
                'bookings_count' => $car->bookings_count,
                'daily_rate' => (float) $car->daily_rate,
            ]);

        $revenueByLocation = Booking::whereHas('payments', fn($q) => $q->where('payment_status', 'completed'))
            ->join('payments', 'bookings.id', '=', 'payments.booking_id')
            ->join('tblvehicle_location', 'bookings.pickup_location_id', '=', 'tblvehicle_location.location_id')
            ->where('payments.payment_status', 'completed')
            ->where('bookings.created_at', '>=', $today->copy()->subMonths($monthsBack))
            ->selectRaw('tblvehicle_location.location, SUM(payments.amount) as revenue')
            ->groupBy('tblvehicle_location.location')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn($r) => ['location' => $r->location, 'revenue' => (float) $r->revenue]);

        $unreadMessages = ContactMessage::where('is_read', false)->count();

        $overdueBookings = Booking::whereIn('status', ['confirmed', 'active'])
            ->whereDate('end_date', '<', $today)
            ->count();

        $lowStockCars = Car::available()->count();

        $heatmapData = Booking::selectRaw('CAST(start_date AS DATE) as date, COUNT(*) as count')
            ->where('start_date', '>=', $today->copy()->subDays(30))
            ->whereIn('status', ['confirmed', 'active'])
            ->groupByRaw('CAST(start_date AS DATE)')
            ->orderByRaw('CAST(start_date AS DATE)')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => $r->count]);

        $stats = [
            'total_cars' => Car::count(),
            'available_cars' => $lowStockCars,
            'rented_cars' => Car::whereHas('bookings', fn($q) => $q->active())->count(),
            'total_bookings' => Booking::where('created_at', '>=', $today->copy()->subMonths($monthsBack))->count(),
            'active_bookings' => Booking::active()->where('created_at', '>=', $today->copy()->subMonths($monthsBack))->count(),
            'total_users' => User::count(),
            'total_guests' => Guest::count(),
            'recent_bookings' => Booking::with(['user', 'guest', 'car'])
                ->latest()
                ->take(10)
                ->get(),
            'revenue' => Payment::where('payment_status', 'completed')
                ->where('created_at', '>=', $today->copy()->subMonths($monthsBack))
                ->sum('amount'),
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
        $monthsBack = min((int) $request->get('months_back', 12), 36);

        $data = [
            'date' => $today->format('F j, Y'),
            'total_cars' => Car::count(),
            'available_cars' => Car::available()->count(),
            'rented_cars' => Car::whereHas('bookings', fn($q) => $q->active())->count(),
            'total_bookings' => Booking::where('created_at', '>=', $today->copy()->subMonths($monthsBack))->count(),
            'active_bookings' => Booking::active()->where('created_at', '>=', $today->copy()->subMonths($monthsBack))->count(),
            'total_users' => User::count(),
            'total_guests' => Guest::count(),
            'revenue' => Payment::where('payment_status', 'completed')
                ->where('created_at', '>=', $today->copy()->subMonths($monthsBack))
                ->sum('amount'),
            'recent_bookings' => Booking::with(['user', 'guest', 'car'])
                ->latest()->take(20)->get(),
            'revenue_by_location' => Booking::whereHas('payments', fn($q) => $q->where('payment_status', 'completed'))
                ->join('payments', 'bookings.id', '=', 'payments.booking_id')
                ->join('tblvehicle_location', 'bookings.pickup_location_id', '=', 'tblvehicle_location.location_id')
                ->where('payments.payment_status', 'completed')
                ->where('bookings.created_at', '>=', $today->copy()->subMonths($monthsBack))
                ->selectRaw('tblvehicle_location.location, SUM(payments.amount) as revenue')
                ->groupBy('tblvehicle_location.location')
                ->orderByDesc('revenue')
                ->get(),
            'booking_status_breakdown' => Booking::selectRaw('status, COUNT(*) as count')
                ->where('created_at', '>=', $today->copy()->subMonths($monthsBack))
                ->groupBy('status')->get(),
        ];

        return view('admin.dashboard-export', $data);
    }
}
