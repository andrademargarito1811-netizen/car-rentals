<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Guest;
use App\Models\VehicleLocation;
use App\Models\AuditLog;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BookingModificationService
{
    public function modify(Booking $booking, array $data): Booking
    {
        $this->assertCanModify($booking);

        $old = [
            'start_date' => $booking->start_date->format('Y-m-d'),
            'end_date' => $booking->end_date->format('Y-m-d'),
            'pickup_time' => $booking->pickup_time,
            'return_time' => $booking->return_time,
            'pickup_location_id' => $booking->pickup_location_id,
            'return_location_id' => $booking->return_location_id,
            'car_id' => $booking->car_id,
            'total_amount' => $booking->total_amount,
        ];

        return DB::transaction(function () use ($booking, $data, $old) {
            $changes = [];

            $carId = $data['car_id'] ?? $booking->car_id;
            $pickupDate = $data['pickup_date'] ?? $booking->start_date->format('Y-m-d');
            $returnDate = $data['return_date'] ?? $booking->end_date->format('Y-m-d');
            $pickupTime = array_key_exists('pickup_time', $data) ? $data['pickup_time'] : $booking->pickup_time;
            $returnTime = array_key_exists('return_time', $data) ? $data['return_time'] : $booking->return_time;

            $pickupLocation = null;
            if (array_key_exists('pickup_location', $data)) {
                $pickupLocation = $data['pickup_location']
                    ? VehicleLocation::where('location', $data['pickup_location'])->value('location_id')
                    : null;
            } else {
                $pickupLocation = $booking->pickup_location_id;
            }

            $returnLocation = null;
            if (array_key_exists('return_location', $data)) {
                $returnLocation = $data['return_location']
                    ? VehicleLocation::where('location', $data['return_location'])->value('location_id')
                    : null;
            } else {
                $returnLocation = $booking->return_location_id;
            }

            if ($carId !== $booking->car_id || $pickupDate !== $old['start_date'] || $returnDate !== $old['end_date']) {
                $this->checkAvailability($carId, $pickupDate, $returnDate, $pickupTime, $returnTime, $booking->id);
            }

            $car = Car::findOrFail($carId);
            $start = now()->parse($pickupDate . ' ' . ($pickupTime ?? '10:00'));
            $end = now()->parse($returnDate . ' ' . ($returnTime ?? '10:00'));
            $days = max(1, (int) ceil($start->diffInSeconds($end, true) / 86400));
            $subtotal = $car->daily_rate * $days;
            $totalTax = $data['total_tax'] ?? 0;
            $totalSurcharge = $data['total_surcharge'] ?? 0;
            $discount = $data['discount'] ?? 0;
            $newTotal = max(0, $subtotal + $totalTax + $totalSurcharge - $discount);

            if ($booking->total_amount != $newTotal) {
                $this->handlePaymentDifference($booking, $booking->total_amount, $newTotal);
            }

            $booking->update([
                'car_id' => $carId,
                'start_date' => $pickupDate,
                'end_date' => $returnDate,
                'pickup_time' => $pickupTime,
                'return_time' => $returnTime,
                'pickup_location_id' => $pickupLocation,
                'return_location_id' => $returnLocation,
                'total_amount' => $newTotal,
                'notes' => array_key_exists('notes', $data) ? $data['notes'] : $booking->notes,
            ]);

            $changes['dates'] = [
                'old' => ['start' => $old['start_date'], 'end' => $old['end_date']],
                'new' => ['start' => $pickupDate, 'end' => $returnDate],
            ];

            if (array_key_exists('first_name', $data) || array_key_exists('last_name', $data) || array_key_exists('email', $data)) {
                $this->updateGuest($booking, $data);
                $changes['guest'] = true;
            }

            if (array_key_exists('coupon_code', $data)) {
                $this->updateCouponUsage($booking, $data);
                $changes['coupon'] = true;
            }

            if (array_key_exists('tax_breakdown', $data)) {
                $this->updateTaxBreakdown($booking, $data['tax_breakdown']);
                $changes['taxes'] = true;
            }

            AuditLog::create([
                'user_id' => request()->user()?->id,
                'action' => 'booking_modified',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => "Booking {$booking->reference_code} modified — total changed from {$old['total_amount']} to {$booking->total_amount}",
                'old_values' => $old,
                'new_values' => [
                    'car_id' => $carId,
                    'start_date' => $pickupDate,
                    'end_date' => $returnDate,
                    'pickup_time' => $pickupTime,
                    'return_time' => $returnTime,
                    'pickup_location_id' => $pickupLocation,
                    'return_location_id' => $returnLocation,
                    'total_amount' => $newTotal,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $booking->fresh();
        });
    }

    private function assertCanModify(Booking $booking): void
    {
        if (!in_array($booking->status, ['pending', 'confirmed'])) {
            abort(422, 'Booking can only be modified when status is pending or confirmed.');
        }
    }

    private function checkAvailability(int $carId, string $startDate, string $endDate, ?string $pickupTime, ?string $returnTime, int $excludeBookingId): void
    {
        $car = Car::with('vehicleClass')->find($carId);
        $graceMinutes = $car?->getGraceMinutes() ?? config('reservation.default_grace_minutes', 30);

        $newPickup = $startDate . ' ' . ($pickupTime ?? '00:00:00');
        $newReturn = $endDate . ' ' . ($returnTime ?? '23:59:59');

        $overlapExists = Booking::overlappingBetween($carId, $newPickup, $newReturn, $graceMinutes, $excludeBookingId)->exists();

        if ($overlapExists) {
            abort(422, 'The selected car already has a booking that overlaps with these dates and times.');
        }
    }

    private function updateGuest(Booking $booking, array $data): void
    {
        $guestData = array_intersect_key($data, array_flip([
            'title', 'first_name', 'last_name', 'driver_age',
            'phone', 'email', 'address', 'address2',
            'country', 'state', 'city', 'postal_code', 'flight_no',
        ]));

        if ($booking->guest_id && $booking->guest) {
            $booking->guest->update($guestData);
        } elseif (!empty($guestData['email'])) {
            $guest = Guest::create($guestData);
            $booking->update(['guest_id' => $guest->guest_id]);
        }
    }

    private function updateCouponUsage(Booking $booking, array $data): void
    {
        $booking->couponUsage()?->delete();

        if (!empty($data['coupon_code']) && ($data['discount'] ?? 0) > 0) {
            $coupon = Coupon::where('code', $data['coupon_code'])->first();
            CouponUsage::create([
                'booking_id' => $booking->id,
                'coupon_id' => $coupon?->id,
                'code' => $data['coupon_code'],
                'discount_amount' => $data['discount'],
            ]);
        }
    }

    private function updateTaxBreakdown(Booking $booking, array $taxBreakdown): void
    {
        $booking->bookingTaxes()->delete();

        foreach ($taxBreakdown as $item) {
            BookingTax::create([
                'booking_id' => $booking->id,
                'tax_id' => $item['id'] ?? null,
                'tax_desc' => $item['tax_desc'],
                'amount' => $item['amount'],
                'add_or_minus' => $item['add_or_minus'],
            ]);
        }
    }

    private function handlePaymentDifference(Booking $booking, float $oldAmount, float $newAmount): void
    {
        $payment = $booking->payment;
        if (!$payment) return;

        if ($newAmount > $oldAmount) {
            Log::info("Booking {$booking->id}: amount increased from {$oldAmount} to {$newAmount} — additional charge needed");
        } elseif ($newAmount < $oldAmount) {
            Log::info("Booking {$booking->id}: amount decreased from {$oldAmount} to {$newAmount} — refund may be needed");
        }
    }
}
