<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\VehicleHandover;

class HandoverChargeCalculator
{
    // Fuel is recorded in bars (0-8). A drop of up to 1 bar is tolerated before
    // the fuel refueling charge applies, since gauges read in discrete bars.
    protected const FUEL_DROP_TOLERANCE = 1;

    public function calculate(Booking $booking, VehicleHandover $pickup, VehicleHandover $return): array
    {
        $car = $booking->car;
        $days = RentalDayCalculator::days(
            $booking->start_date->toDateString(),
            $booking->pickup_time,
            $booking->end_date->toDateString(),
            $booking->return_time,
        );

        $fuelDrop = (int) $pickup->fuel_level - (int) $return->fuel_level;
        $fuelRefuel = $fuelDrop > static::FUEL_DROP_TOLERANCE && (float) ($car->fuel_charges ?? 0) > 0
            ? (float) $car->fuel_charges
            : 0.0;

        $kmDriven = max(0, (float) $return->odometer - (float) $pickup->odometer);
        $freeKm = ($car->free_km_per_day ?? 0) * $days;
        $excessKm = max(0, $kmDriven - $freeKm);
        $excessMileage = $excessKm > 0 && (float) ($car->additional_km_rate ?? 0) > 0
            ? round($excessKm * (float) $car->additional_km_rate, 2)
            : 0.0;

        $total = round($fuelRefuel + $excessMileage, 2);

        return [
            'fuel_refuel' => $fuelRefuel,
            'fuel_missing' => max(0, $fuelDrop),
            'excess_mileage' => $excessMileage,
            'excess_km' => $excessKm,
            'km_driven' => $kmDriven,
            'total' => $total,
        ];
    }
}
