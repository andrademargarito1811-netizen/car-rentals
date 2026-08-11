<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Guest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GuestController extends Controller
{
    public function index(Request $request)
    {
        $query = Guest::withCount('bookings');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');
        $allowed = ['created_at', 'first_name', 'email', 'bookings_count'];
        if (! in_array($sortField, $allowed, true)) {
            $sortField = 'created_at';
        }
        $query->orderBy($sortField, in_array($sortDirection, ['asc', 'desc'], true) ? $sortDirection : 'desc');

        $guests = $query->paginate(15)->withQueryString();

        $guests->getCollection()->transform(function ($guest) {
            return [
                'guest_id' => $guest->guest_id,
                'title' => $guest->title,
                'first_name' => $guest->first_name,
                'last_name' => $guest->last_name,
                'company_name' => $guest->company_name,
                'email' => $guest->email,
                'phone' => $guest->phone,
                'country' => $guest->country,
                'bookings_count' => $guest->bookings_count,
                'created_at' => $guest->created_at,
            ];
        });

        return Inertia::render('Admin/Guests/Index', [
            'guests' => $guests,
            'filters' => [
                'search' => $request->get('search'),
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
            'stats' => [
                'total' => Guest::count(),
                'total_bookings' => Booking::whereNotNull('guest_id')->count(),
                'returning' => Guest::has('bookings', '>=', 2)->count(),
                'this_month' => Guest::where('created_at', '>=', now()->startOfMonth())->count(),
            ],
        ]);
    }

    public function show(Guest $guest)
    {
        $bookings = Booking::with(['car', 'pickupLocation', 'returnLocation'])
            ->where('guest_id', $guest->guest_id)
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Guests/Show', [
            'guest' => [
                'guest_id' => $guest->guest_id,
                'title' => $guest->title,
                'first_name' => $guest->first_name,
                'last_name' => $guest->last_name,
                'company_name' => $guest->company_name,
                'driver_age' => $guest->driver_age,
                'phone' => $guest->phone,
                'email' => $guest->email,
                'address' => $guest->address,
                'address2' => $guest->address2,
                'country' => $guest->country,
                'state' => $guest->state,
                'city' => $guest->city,
                'postal_code' => $guest->postal_code,
                'flight_no' => $guest->flight_no,
                'created_at' => $guest->created_at,
            ],
            'bookings' => $bookings,
            'drivers' => $guest->drivers()->latest()->get(['driver_id', 'first_name', 'last_name', 'birth_date', 'license_number', 'license_category', 'license_expiry'])->map(function ($driver) {
                return [
                    'driver_id' => $driver->driver_id,
                    'first_name' => $driver->first_name,
                    'last_name' => $driver->last_name,
                    'birth_date' => $driver->birth_date,
                    'license_number' => $driver->maskedLicenseNumber(),
                    'license_category' => $driver->license_category,
                    'license_expiry' => $driver->license_expiry,
                ];
            }),
            'stats' => [
                'total_bookings' => Booking::where('guest_id', $guest->guest_id)->count(),
                'active_bookings' => Booking::where('guest_id', $guest->guest_id)->active()->count(),
                'total_spent' => Booking::where('guest_id', $guest->guest_id)->where('status', '!=', 'cancelled')->sum('total_amount'),
            ],
        ]);
    }
}
