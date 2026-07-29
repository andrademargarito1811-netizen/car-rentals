<?php

namespace App\Services;

use App\Events\BookingCreated;
use App\Mail\GuestBookingConfirmation;
use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Guest;
use App\Models\VehicleLocation;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BookingCreationService
{
    public function create(array $data, ?\Illuminate\Http\Request $request = null): Booking
    {
        $car = Car::with('vehicleClass')->findOrFail($data['car_id']);
        $graceMinutes = $car->getGraceMinutes();

        $newPickup = $data['pickup_date'] . ' ' . ($data['pickup_time'] ?? '00:00:00');
        $newReturn = $data['return_date'] . ' ' . ($data['return_time'] ?? '23:59:59');
        $overlapExists = Booking::overlappingBetween($data['car_id'], $newPickup, $newReturn, $graceMinutes)->exists();
        if ($overlapExists) {
            abort(422, 'The selected car already has a booking that overlaps with these dates and times.');
        }

        $guest = Guest::create([
            'email' => $data['email'],
            'title' => $data['title'] ?? null,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'driver_age' => $data['driver_age'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'address2' => $data['address2'] ?? null,
            'country' => $data['country'] ?? null,
            'state' => $data['state'] ?? null,
            'city' => $data['city'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'flight_no' => $data['flight_no'] ?? null,
        ]);

        $pickupLocation = !empty($data['pickup_location'])
            ? VehicleLocation::where('location', $data['pickup_location'])->value('location_id')
            : null;
        $returnLocation = !empty($data['return_location'])
            ? VehicleLocation::where('location', $data['return_location'])->value('location_id')
            : null;

        $days = max(1, now()->parse($data['pickup_date'])->diffInDays(now()->parse($data['return_date'])));
        $subtotal = $car->daily_rate * $days;
        $totalTax = $data['total_tax'] ?? 0;
        $totalSurcharge = $data['total_surcharge'] ?? 0;
        $discount = $data['discount'] ?? 0;
        $totalAmount = $subtotal + $totalTax + $totalSurcharge - $discount;

        $booking = Booking::create([
            'guest_id' => $guest->guest_id,
            'car_id' => $data['car_id'],
            'start_date' => $data['pickup_date'],
            'end_date' => $data['return_date'],
            'pickup_time' => $data['pickup_time'] ?? null,
            'return_time' => $data['return_time'] ?? null,
            'pickup_location_id' => $pickupLocation,
            'return_location_id' => $returnLocation,
            'total_amount' => max(0, $totalAmount),
            'status' => 'pending',
            'notes' => null,
        ]);

        if (!empty($data['coupon_code']) && ($data['discount'] ?? 0) > 0) {
            $coupon = Coupon::where('code', $data['coupon_code'])->first();
            CouponUsage::create([
                'booking_id' => $booking->id,
                'coupon_id' => $coupon?->id,
                'code' => $data['coupon_code'],
                'discount_amount' => $data['discount'],
            ]);
        }

        if (!empty($data['tax_breakdown'])) {
            foreach ($data['tax_breakdown'] as $item) {
                BookingTax::create([
                    'booking_id' => $booking->id,
                    'tax_id' => $item['id'] ?? null,
                    'tax_desc' => $item['tax_desc'],
                    'amount' => $item['amount'],
                    'add_or_minus' => $item['add_or_minus'],
                ]);
            }
        }

        $ip = $request?->ip();
        $ua = $request?->userAgent();

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'booking_created',
            'model_type' => Booking::class,
            'model_id' => $booking->id,
            'description' => "Guest booking created for {$car->brand} {$car->model} by {$guest->first_name} {$guest->last_name}",
            'ip_address' => $ip,
            'user_agent' => $ua,
        ]);

        try {
            event(new BookingCreated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed for booking #' . $booking->id . ': ' . $e->getMessage());
        }

        if (!auth()->check()) {
            try {
                Mail::to($guest->email)->queue(new GuestBookingConfirmation($booking));
            } catch (\Throwable $e) {
                Log::warning('Confirmation email failed for booking #' . $booking->id . ': ' . $e->getMessage());
            }
        }

        return $booking;
    }
}
