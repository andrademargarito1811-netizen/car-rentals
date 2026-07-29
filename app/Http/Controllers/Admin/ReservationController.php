<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Inertia\Inertia;

class ReservationController extends Controller
{
    public function index()
    {
        $bookings = Booking::with(['user', 'guest', 'car'])
            ->latest()
            ->paginate(10);

        return Inertia::render('Admin/Reservations/Index', [
            'bookings' => $bookings,
        ]);
    }
}
