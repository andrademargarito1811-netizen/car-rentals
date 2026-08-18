<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\VehicleHandover;
use Illuminate\Support\Collection;

class HandoverChargeCalculator
{
    // Fuel is recorded in bars (0-8). A drop of up to 1 bar is tolerated before
    // the fuel refueling charge applies, since gauges read in discrete bars.
    protected const FUEL_DROP_TOLERANCE = 1;

    /**
     * Compute fuel/mileage charges for a booking, split per car segment.
     *
     * Handovers are paired pickup → return in chronological order and each pair
     * is charged against its own car's rates and its own segment's days, so a
     * mid-rental swap charges the outgoing car for the distance driven on it and
     * the replacement car for the distance driven on it, instead of comparing
     * two unrelated cars' odometers.
     *
     * $pendingReturn is an un-persisted return handover (the one being recorded
     * during check-in) so the preview charge matches the stored charge exactly.
     */
    public function calculate(Booking $booking, ?VehicleHandover $pendingReturn = null): array
    {
        $handovers = $booking->handovers()->with('car')->orderBy('id')->get();

        if ($pendingReturn) {
            $pendingReturn->load('car');
            $handovers->push($pendingReturn);
        }

        $spans = $this->segmentSpans($booking);

        $wholeDays = RentalDayCalculator::days(
            $booking->start_date->format('Y-m-d'),
            $booking->pickup_time,
            $booking->end_date->format('Y-m-d'),
            $booking->return_time,
        );

        $fuelRefuel = 0.0;
        $fuelMissing = 0;
        $excessMileage = 0.0;
        $excessKm = 0;
        $kmDriven = 0.0;

        $spanIndex = 0;

        foreach ($this->pairHandovers($handovers) as $pair) {
            [$pickup, $return] = $pair;

            // A pair belongs to the same car when both handovers share its id —
            // normal check-ins and admin-driven swaps. Mismatched pairs (e.g. a
            // swap performed without handover capture) fall back to the booking's
            // current car and the whole window, mirroring the pre-swap behaviour.
            $matched = $pickup->car && $return->car && (int) $pickup->car_id === (int) $return->car_id;
            $car = $matched ? $pickup->car : $booking->car;
            if (! $car) {
                continue;
            }

            $days = $wholeDays;
            if ($matched) {
                $found = $this->findSpan($spans, (int) $car->id, $spanIndex);
                if ($found) {
                    $span = $found['span'];
                    $spanIndex = $found['index'] + 1;
                    $days = RentalDayCalculator::days(
                        $span['start_date'],
                        $span['start_time'],
                        $span['end_date'],
                        $span['end_time'],
                    );
                }
            }

            $fuelDrop = (int) $pickup->fuel_level - (int) $return->fuel_level;
            if ($fuelDrop > static::FUEL_DROP_TOLERANCE && (float) ($car->fuel_charges ?? 0) > 0) {
                $fuelRefuel += (float) $car->fuel_charges;
            }
            $fuelMissing += max(0, $fuelDrop);

            $km = max(0, (float) $return->odometer - (float) $pickup->odometer);
            $kmDriven += $km;

            $freeKm = (float) ($car->free_km_per_day ?? 0) * $days;
            $segmentExcess = max(0, $km - $freeKm);
            $excessKm += (int) round($segmentExcess);
            if ($segmentExcess > 0 && (float) ($car->additional_km_rate ?? 0) > 0) {
                $excessMileage += round($segmentExcess * (float) $car->additional_km_rate, 2);
            }
        }

        return [
            'fuel_refuel' => round($fuelRefuel, 2),
            'fuel_missing' => $fuelMissing,
            'excess_mileage' => round($excessMileage, 2),
            'excess_km' => $excessKm,
            'km_driven' => round($kmDriven, 2),
            'total' => round($fuelRefuel + $excessMileage, 2),
        ];
    }

    /**
     * Group handovers into pickup → return pairs in chronological order. Stray
     * returns without a preceding pickup (e.g. a swap-out handover recorded
     * before the car was ever picked up) and trailing pickups are dropped.
     *
     * @param  Collection<int, VehicleHandover>  $handovers
     * @return array<int, array{0: VehicleHandover, 1: VehicleHandover}>
     */
    private function pairHandovers(Collection $handovers): array
    {
        $pairs = [];
        $open = null;

        foreach ($handovers as $handover) {
            if ($handover->type === 'pickup') {
                $open = $handover;
            } elseif ($handover->type === 'return' && $open) {
                $pairs[] = [$open, $handover];
                $open = null;
            }
        }

        return $pairs;
    }

    /**
     * The rental split into per-car segments with their day boundaries. Each
     * segment references the car that was on the booking during it.
     *
     * @return array<int, array{ car_id: int, start_date: string, start_time: ?string, end_date: string, end_time: ?string }>
     */
    private function segmentSpans(Booking $booking): array
    {
        $swaps = $booking->swaps()->orderBy('swap_date')->orderBy('id')->get();

        $spans = [];
        $boundaryDate = $booking->start_date->format('Y-m-d');
        $boundaryTime = $booking->pickup_time ? substr($booking->pickup_time, 0, 5) : null;

        foreach ($swaps as $swap) {
            $spans[] = [
                'car_id' => (int) $swap->from_car_id,
                'start_date' => $boundaryDate,
                'start_time' => $boundaryTime,
                'end_date' => $swap->swap_date->format('Y-m-d'),
                'end_time' => $swap->swap_time ? substr($swap->swap_time, 0, 5) : null,
            ];
            $boundaryDate = $swap->swap_date->format('Y-m-d');
            $boundaryTime = $swap->swap_time ? substr($swap->swap_time, 0, 5) : null;
        }

        $spans[] = [
            'car_id' => (int) $booking->car_id,
            'start_date' => $boundaryDate,
            'start_time' => $boundaryTime,
            'end_date' => $booking->end_date->format('Y-m-d'),
            'end_time' => $booking->return_time ? substr($booking->return_time, 0, 5) : null,
        ];

        return $spans;
    }

    private function findSpan(array $spans, int $carId, int $fromIndex = 0): ?array
    {
        for ($i = $fromIndex; $i < count($spans); $i++) {
            if ($spans[$i]['car_id'] === $carId) {
                return ['span' => $spans[$i], 'index' => $i];
            }
        }

        return null;
    }
}
