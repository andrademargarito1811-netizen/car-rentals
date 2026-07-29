<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\LocationsPageSetting;
use App\Models\ReservationSetting;
use App\Models\VehicleLocation;
use App\Models\WhyBookItem;
use Inertia\Inertia;

class PageController extends Controller
{
    public function fleet()
    {
        $today = now()->startOfDay();
        $end = now()->addDays(60)->endOfDay();

        $cars = Car::withReviewStats()->paginate(12);
        $cars->load(['bookings' => fn($q) => $q
            ->whereIn('status', ['confirmed', 'active'])
            ->where('end_date', '>=', $today)
            ->where('start_date', '<=', $end)
        ]);
        $cars->getCollection()->transform(function ($car) {
            $car->booked_dates = $car->bookedDates(60);
            return $car;
        });

        return Inertia::render('Fleet', ['cars' => $cars]);
    }

    public function locations()
    {
        $locations = VehicleLocation::active()->orderBy('sort_order')->get();
        $pageSettings = LocationsPageSetting::first();

        return Inertia::render('Locations', [
            'locations' => $locations,
            'pageSettings' => $pageSettings,
        ]);
    }

    public function contact()
    {
        return Inertia::render('Contact');
    }

    public function reservations()
    {
        $reservationSettings = ReservationSetting::with('heroImages')->first();
        $whyBookItems = WhyBookItem::active()->get();
        $locations = VehicleLocation::active()->orderBy('sort_order')->get();

        return Inertia::render('Reservation', [
            'reservationSettings' => $reservationSettings,
            'whyBookItems' => $whyBookItems,
            'pageLocations' => $locations,
        ]);
    }

    public function bookNow(string $carId)
    {
        $car = Car::findOrFail($carId);

        $rental = request()->only([
            'pickup_date', 'pickup_time', 'pickup_location',
            'return_date', 'return_time', 'return_location',
        ]);

        $reservationSettings = ReservationSetting::first();

        $data = [
            'carId' => $carId,
            'car' => $car,
            'booked_dates' => $car->bookedDates(60),
            'reservationSettings' => $reservationSettings,
        ];

        if (!empty($rental['pickup_date'])) {
            $data['rental'] = $rental;
        }

        return Inertia::render('BookNow', $data);
    }

    public function dashboard()
    {
        $bookings = Booking::with('car')
            ->where('user_id', auth()->id())
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'recentBookings' => $bookings,
            'stats' => [
                'total_bookings' => Booking::where('user_id', auth()->id())->count(),
                'active_bookings' => Booking::where('user_id', auth()->id())->active()->count(),
            ],
        ]);
    }
}
