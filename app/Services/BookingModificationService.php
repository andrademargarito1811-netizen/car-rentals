<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\CouponUsage;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\VehicleLocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BookingModificationService
{
    public function __construct(
        private BookingPricingService $pricing,
    ) {}

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

            $car = Car::with('vehicleClass')->findOrFail($carId);

            $couponCode = array_key_exists('coupon_code', $data)
                ? ($data['coupon_code'] ?? null)
                : ($booking->couponUsage?->code ?? null);

            $price = $this->pricing->calculate(
                $car,
                $pickupDate,
                $pickupTime,
                $returnDate,
                $returnTime,
                $pickupLocation,
                $couponCode,
            );

            $newTotal = $price['total'];

            if ($booking->total_amount != $newTotal) {
                $this->handlePaymentDifference($booking, (float) $booking->total_amount, (float) $newTotal);
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

            $this->updateCouponUsage($booking, $price);
            $changes['coupon'] = true;

            $this->updateTaxBreakdown($booking, $price['taxes']);
            $changes['taxes'] = true;

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
        if (! in_array($booking->status, ['pending', 'confirmed'])) {
            abort(422, 'Booking can only be modified when status is pending or confirmed.');
        }
    }

    private function checkAvailability(int $carId, string $startDate, string $endDate, ?string $pickupTime, ?string $returnTime, int $excludeBookingId): void
    {
        $car = Car::with('vehicleClass')->find($carId);
        $graceMinutes = $car?->getGraceMinutes() ?? config('reservation.default_grace_minutes', 30);

        $newPickup = $startDate.' '.($pickupTime ?? '00:00:00');
        $newReturn = $endDate.' '.($returnTime ?? '23:59:59');

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
            'country', 'state', 'city', 'postal_code', 'company_name', 'flight_no',
        ]));

        if ($booking->guest_id && $booking->guest) {
            $booking->guest->update($guestData);
        } elseif (! empty($guestData['email'])) {
            $guest = Guest::create($guestData);
            $booking->update(['guest_id' => $guest->guest_id]);
        }
    }

    private function updateCouponUsage(Booking $booking, array $price): void
    {
        $booking->couponUsage()?->delete();

        if ($price['coupon'] && $price['coupon_discount'] > 0) {
            CouponUsage::create([
                'booking_id' => $booking->id,
                'coupon_id' => $price['coupon']->id,
                'code' => $price['coupon']->code,
                'discount_amount' => $price['coupon_discount'],
            ]);
        }
    }

    private function updateTaxBreakdown(Booking $booking, array $taxes): void
    {
        $booking->bookingTaxes()->delete();

        foreach ($taxes as $item) {
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
        if (abs($oldAmount - $newAmount) < 0.005) {
            return;
        }

        if ($newAmount > $oldAmount) {
            Log::info("Booking {$booking->id}: amount increased from {$oldAmount} to {$newAmount} — additional charge needed");

            return;
        }

        $paid = round((float) $booking->completedPayments()->sum('amount'), 2);
        $overpaid = round($paid - $newAmount, 2);

        if ($overpaid <= 0) {
            Log::info("Booking {$booking->id}: amount decreased from {$oldAmount} to {$newAmount} — no refund needed");

            return;
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -$overpaid,
            'payment_method' => 'Adjustment',
            'payment_status' => 'completed',
            'transaction_id' => 'ADJ-'.strtoupper(Str::random(10)),
            'metadata' => [
                'reason' => 'booking_total_decreased',
                'old_amount' => $oldAmount,
                'new_amount' => $newAmount,
                'source' => 'auto',
            ],
        ]);

        AuditLog::create([
            'user_id' => request()->user()?->id,
            'action' => 'refund_recorded',
            'model_type' => Payment::class,
            'model_id' => $payment->id,
            'description' => "Booking {$booking->reference_code} total decreased from \${$oldAmount} to \${$newAmount} — refund of \${$overpaid} auto-recorded",
            'old_values' => ['total_amount' => $oldAmount],
            'new_values' => ['total_amount' => $newAmount, 'refund_amount' => $overpaid],
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        Log::info("Booking {$booking->id}: amount decreased from {$oldAmount} to {$newAmount} — refund of {$overpaid} recorded");
    }
}
