<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function create(Booking $booking)
    {
        if ($booking->status !== 'completed') {
            return redirect()->route('bookings.lookup')
                ->with('error', 'You can only review completed bookings.');
        }

        if ($booking->review()->exists()) {
            return redirect()->route('bookings.guest.show', $booking->reference_code)
                ->with('error', 'You have already reviewed this booking.');
        }

        $booking->load(['car', 'guest', 'user']);

        return Inertia::render('Reviews/Create', [
            'booking' => $booking,
        ]);
    }

    public function store(Request $request, Booking $booking)
    {
        if ($booking->status !== 'completed') {
            return redirect()->route('bookings.lookup')
                ->with('error', 'You can only review completed bookings.');
        }

        if ($booking->review()->exists()) {
            return redirect()->route('bookings.guest.show', $booking->reference_code)
                ->with('error', 'You have already reviewed this booking.');
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
        ]);

        Review::create([
            'booking_id' => $booking->id,
            'car_id' => $booking->car_id,
            'user_id' => $booking->user_id,
            'guest_id' => $booking->guest_id,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return redirect()->route('bookings.guest.show', $booking->reference_code)
            ->with('success', 'Thank you! Your review has been submitted.');
    }
}
