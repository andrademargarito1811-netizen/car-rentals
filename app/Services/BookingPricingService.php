<?php

namespace App\Services;

use App\Models\Car;
use App\Models\Coupon;

class BookingPricingService
{
    public function __construct(
        private TaxCalculationService $taxService,
        private CouponDiscountService $couponService,
    ) {}

    /**
     * Compute the authoritative price for a booking window.
     *
     * The server derives subtotal, taxes, surcharges and coupon discount from
     * authoritative data (vehicle rate, class, location and the coupon table)
     * instead of trusting client-supplied amounts.
     *
     * @return array{
     *     billing_days: int,
     *     daily_rate: float,
     *     subtotal: float,
     *     taxes: array,
     *     total_tax: float,
     *     total_surcharge: float,
     *     total_discount: float,
     *     coupon: Coupon|null,
     *     coupon_discount: float,
     *     total: float,
     * }
     */
    public function calculate(
        Car $car,
        string $pickupDate,
        ?string $pickupTime,
        string $returnDate,
        ?string $returnTime,
        ?int $pickupLocationId,
        ?string $couponCode,
    ): array {
        $billingDays = RentalDayCalculator::days($pickupDate, $pickupTime, $returnDate, $returnTime);
        $dailyRate = (float) $car->daily_rate;
        $subtotal = round($dailyRate * $billingDays, 2);

        $taxResult = $this->taxService->calculate(
            (string) ($car->vehicleClass?->class_no ?? ''),
            $pickupLocationId,
            $billingDays,
            $dailyRate,
            $subtotal,
        );

        $couponResult = $this->couponService->discount($couponCode, $subtotal, $billingDays, $dailyRate);

        $couponDiscount = $couponResult['valid']
            ? round((float) $couponResult['discount'], 2)
            : 0.0;

        $total = max(0.0, round(
            $subtotal
                + (float) $taxResult['total_tax']
                + (float) $taxResult['total_surcharge']
                - (float) $taxResult['total_discount']
                - $couponDiscount,
            2,
        ));

        return [
            'billing_days' => $billingDays,
            'daily_rate' => $dailyRate,
            'subtotal' => $subtotal,
            'taxes' => $taxResult['taxes'],
            'total_tax' => (float) $taxResult['total_tax'],
            'total_surcharge' => (float) $taxResult['total_surcharge'],
            'total_discount' => (float) $taxResult['total_discount'],
            'coupon' => $couponResult['valid'] ? $couponResult['coupon'] : null,
            'coupon_discount' => $couponDiscount,
            'total' => $total,
        ];
    }
}
