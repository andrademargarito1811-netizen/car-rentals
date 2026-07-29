<?php

namespace App\Services;

use App\Models\Car;
use App\Models\Tax;
use App\Models\VehicleLocation;

class TaxCalculationService
{
    /**
     * Compute applicable taxes for a booking.
     *
     * @param string $classNo  The vehicle class_no
     * @param int|null $locationId  Pickup location ID (nullable)
     * @param int $billingDays
     * @param float $dailyRate
     * @param float $subtotal
     * @return array{ taxes: array, total_tax: float, total_surcharge: float, total_discount: float }
     */
    public function calculate(string $classNo, ?int $locationId, int $billingDays, float $dailyRate, float $subtotal): array
    {
        $taxes = Tax::with(['category', 'vehicleClasses'])
            ->where('is_active', true)
            ->get();

        $results = [];
        $totalTax = 0;
        $totalSurcharge = 0;
        $totalDiscount = 0;

        foreach ($taxes as $tax) {
            // Skip if location-specific and doesn't match
            if ($tax->location_id !== null && $tax->location_id !== $locationId) {
                continue;
            }

            // If apply_always is false, this tax is not applicable
            if (!$tax->apply_always) {
                continue;
            }

            // Must have a matching vehicle class pivot
            $matchedClasses = $tax->vehicleClasses->pluck('class_no')->map(fn($v) => (string) $v)->toArray();
            if (!in_array((string) $classNo, $matchedClasses, true)) {
                continue;
            }

            // Compute base amount
            $rate = (float) $tax->rate;
            $baseAmount = 0;

            if ($tax->value_in === 'Percentage') {
                if ($tax->calculation === 'Per Day') {
                    $baseAmount = ($dailyRate * $rate / 100) * $billingDays;
                } else {
                    // Per Rental
                    $baseAmount = $subtotal * $rate / 100;
                }
            } else {
                // Amount
                if ($tax->calculation === 'Per Day') {
                    $baseAmount = $rate * $billingDays;
                } else {
                    // Per Rental
                    $baseAmount = $rate;
                }
            }

            $amount = round($baseAmount, 2);

            if ($amount == 0) {
                continue;
            }

            $categoryName = $tax->category?->name ?? 'Other';

            $results[] = [
                'id' => $tax->id,
                'tax_desc' => $tax->tax_desc,
                'category' => $categoryName,
                'calculation' => $tax->calculation,
                'value_in' => $tax->value_in,
                'rate' => (float) $tax->rate,
                'add_or_minus' => $tax->add_or_minus,
                'amount' => $amount,
            ];

            if ($tax->add_or_minus) {
                $totalTax += $amount;
                if ($categoryName === 'Surcharge') {
                    $totalSurcharge += $amount;
                }
            } else {
                $totalDiscount += $amount;
            }
        }

        return [
            'taxes' => $results,
            'total_tax' => round($totalTax, 2),
            'total_surcharge' => round($totalSurcharge, 2),
            'total_discount' => round($totalDiscount, 2),
        ];
    }

    /**
     * Look up car by ID and compute taxes.
     */
    public function calculateForCar(int $carId, ?string $pickupLocation, int $billingDays, float $dailyRate, float $subtotal): array
    {
        $car = Car::with('vehicleClass')->find($carId);
        if (!$car || !$car->vehicleClass) {
            return [
                'taxes' => [],
                'total_tax' => 0,
                'total_surcharge' => 0,
                'total_discount' => 0,
            ];
        }

        $locationId = null;
        if ($pickupLocation) {
            $location = VehicleLocation::where('location', $pickupLocation)->first();
            $locationId = $location?->location_id;
        }

        return $this->calculate(
            $car->vehicleClass->class_no,
            $locationId,
            $billingDays,
            $dailyRate,
            $subtotal
        );
    }
}
