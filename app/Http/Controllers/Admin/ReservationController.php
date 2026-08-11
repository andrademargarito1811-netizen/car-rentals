<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReservationController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['user', 'guest', 'car']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                    ->orWhereHas('car', function ($carQ) use ($search) {
                        $carQ->where('brand', 'like', "%{$search}%")
                            ->orWhere('model', 'like', "%{$search}%")
                            ->orWhere('license_plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('user', function ($userQ) use ($search) {
                        $userQ->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('guest', function ($guestQ) use ($search) {
                        $guestQ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            });
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Admin/Reservations/Index', [
            'bookings' => $bookings,
            'filters' => $request->only(['status', 'search']),
        ]);
    }
}
