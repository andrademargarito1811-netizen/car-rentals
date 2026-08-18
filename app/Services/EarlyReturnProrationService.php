<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\CouponUsage;
use App\Models\VehicleHandover;
use Illuminate\Support\Carbon;

class EarlyReturnProrationService
{
    /**
     * Compute the prorated base rental total when a rental is returned before
     * its reserved window ends, or null when no proration applies.
     *
     * Uses the booking's stored tax snapshot (booking_taxes) and coupon discount
     * so the result scales the original price exactly, without re-validating
     * live tax/coupon data that may have changed since booking.
     */
    public function proratedBase(Booking $booking, VehicleHandover $returnHandover): ?float
    {
        $pickup = $booking->pickupHandover;
        if (! $pickup || ! $pickup->captured_at || ! $returnHandover->returned_at) {
            return null;
        }

        try {
            $returnedAt = Carbon::parse($returnHandover->returned_at);
        } catch (\Throwable) {
            return null;
        }

        $reservedDays = RentalDayCalculator::days(
            $booking->start_date->format('Y-m-d'),
            $booking->pickup_time,
            $booking->end_date->format('Y-m-d'),
            $booking->return_time,
        );

        $actualDays = RentalDayCalculator::days(
            $pickup->captured_at->format('Y-m-d'),
            $pickup->captured_at->format('H:i:s'),
            $returnedAt->format('Y-m-d'),
            $returnedAt->format('H:i:s'),
        );

        if ($actualDays >= $reservedDays) {
            return null;
        }

        $booking->loadMissing(['car', 'bookingTaxes.tax', 'couponUsage.coupon.couponType']);

        $dailyRate = (float) ($booking->car?->daily_rate ?? 0);
        $subtotal = round($dailyRate * $actualDays, 2);

        $taxTotal = 0.0;
        foreach ($booking->bookingTaxes as $bookingTax) {
            $amount = $this->recomputeTaxAmount($bookingTax, $subtotal, $actualDays, $dailyRate, $reservedDays);
            $taxTotal += $bookingTax->add_or_minus ? $amount : -$amount;
        }

        $couponDiscount = $this->recomputeCouponDiscount($booking->couponUsage, $subtotal, $actualDays, $dailyRate);

        return max(0.0, round($subtotal + $taxTotal - $couponDiscount, 2));
    }

    /**
     * Recompute the coupon discount for the prorated window. Percentage and
     * per-day/day-free discounts scale with the actual days, while fixed-amount
     * discounts stay unchanged (capped at the new subtotal).
     */
    private function recomputeCouponDiscount(?CouponUsage $usage, float $subtotal, int $actualDays, float $dailyRate): float
    {
        if (! $usage || ! $usage->coupon) {
            return 0.0;
        }

        $coupon = $usage->coupon;
        $typeName = $coupon->couponType?->name ?? 'Amount';
        $minRate = (float) ($coupon->min_rate ?? 0);

        return match ($typeName) {
            'Percentage' => round($subtotal * $minRate / 100, 2),
            'Per Day' => round(min($minRate * $actualDays, $subtotal), 2),
            'Day Free' => round(min((int) $minRate, $actualDays) * $dailyRate, 2),
            default => round(min($minRate, $subtotal), 2),
        };
    }

    private function recomputeTaxAmount(BookingTax $bookingTax, float $subtotal, int $actualDays, float $dailyRate, int $reservedDays): float
    {
        $tax = $bookingTax->tax;

        // Snapshot row whose source tax was removed: scale the stored amount in
        // proportion to the actual days as a best-effort fallback.
        if (! $tax) {
            return $reservedDays > 0
                ? round((float) $bookingTax->amount * $actualDays / $reservedDays, 2)
                : 0.0;
        }

        $rate = (float) $tax->rate;

        if ($tax->value_in === 'Percentage') {
            $base = $tax->calculation === 'Per Day'
                ? ($dailyRate * $rate / 100) * $actualDays
                : $subtotal * $rate / 100;
        } else {
            $base = $tax->calculation === 'Per Day'
                ? $rate * $actualDays
                : $rate;
        }

        return round($base, 2);
    }
}
