<?php

namespace App\Services;

use App\Exceptions\BookingSwapException;
use App\Models\Booking;
use App\Models\BookingSwap;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\VehicleHandover;
use Illuminate\Support\Facades\DB;

class BookingSwapService
{
    public function __construct(
        private TaxCalculationService $taxService,
    ) {}

    /**
     * Price switching the current vehicle for another one mid-rental. The
     * rental window (pickup → return dates) stays unchanged; only the car and
     * the per-day rate change from the swap date onward. Days already driven in
     * the outgoing car keep its rate, the remaining days are priced on the new
     * car, so the total becomes the sum of every per-car segment.
     *
     * @return array{
     *     from_car: array, to_car: array, swap_date: string,
     *     from_days: int, to_days: int, from_subtotal: float, to_subtotal: float,
     *     old_total_amount: float, new_total_amount: float, price_delta: float,
     *     segments: array, taxes: array,
     * }
     */
    public function quote(Booking $booking, int $toCarId, string $swapDate, ?string $swapTime): array
    {
        $this->assertCanSwap($booking);

        $toCar = Car::with(['vehicleClass', 'availability'])->findOrFail($toCarId);

        if ((int) $toCar->id === (int) $booking->car_id) {
            throw new BookingSwapException('That vehicle is already assigned to this reservation.');
        }

        if (! $toCar->isAvailable()) {
            throw new BookingSwapException('That vehicle is currently not available for new bookings.');
        }

        $swap = \Illuminate\Support\Carbon::parse($swapDate);
        $minUsageHours = (int) config('reservation.swap_min_usage_hours', 2);

        $pickup = \Illuminate\Support\Carbon::parse(
            $booking->start_date->format('Y-m-d').' '.($booking->pickup_time ?? '00:00:00')
        );
        $return = \Illuminate\Support\Carbon::parse(
            $booking->end_date->format('Y-m-d').' '.($booking->return_time ?? '23:59:59')
        );
        $swapAt = \Illuminate\Support\Carbon::parse(
            $swapDate.' '.($swapTime ? substr($swapTime, 0, 5).':00' : '00:00:00')
        );

        if ($swapAt->lt($pickup->copy()->addHours($minUsageHours)) || $swapAt->gt($return)) {
            throw new BookingSwapException('The swap date must be at least '.$minUsageHours.' hours after pickup and no later than the return.');
        }

        $graceMinutes = $toCar->getGraceMinutes();
        $windowStart = $swapDate.' '.($swapTime ? substr($swapTime, 0, 5).':00' : '00:00:00');
        $windowEnd = $booking->end_date->format('Y-m-d').' '.($booking->return_time ?? '23:59:59');

        $conflict = Booking::overlappingBetween(
            $toCar->id,
            $windowStart,
            $windowEnd,
            $graceMinutes,
            $booking->id,
        )->first();

        if ($conflict) {
            throw new BookingSwapException('That vehicle is already reserved for part of the requested period.');
        }

        $segments = $this->buildSegments($booking, $toCar, $swapDate, $swapTime);
        $priced = $this->priceSegments($booking, $segments);

        $from = $priced['segments'][count($priced['segments']) - 2];
        $to = $priced['segments'][count($priced['segments']) - 1];

        $oldTotal = (float) $booking->total_amount;
        $newTotal = round($priced['total'], 2);

        return [
            'from_car' => $from['car'],
            'to_car' => $to['car'],
            'swap_date' => $swapDate,
            'from_days' => (int) $from['days'],
            'to_days' => (int) $to['days'],
            'from_subtotal' => (float) $from['subtotal'],
            'to_subtotal' => (float) $to['subtotal'],
            'old_total_amount' => $oldTotal,
            'new_total_amount' => $newTotal,
            'price_delta' => round($newTotal - $oldTotal, 2),
            'segments' => $priced['segments'],
            'taxes' => $priced['taxes'],
        ];
    }

    /**
     * Apply a mid-rental vehicle swap in a transaction: switch the booking to
     * the new car, update the total to the blended per-segment price, replace
     * the tax breakdown, record the swap and an audit entry. The original
     * rental window and the booking itself are otherwise unchanged.
     *
     * When a swap-in/swap-out handover is supplied (admin-driven swaps) the
     * outgoing car's condition is recorded as a return handover and the
     * replacement car's baseline as a pickup handover, so each car can later be
     * charged fuel/mileage against its own baseline. Guest-driven swaps pass no
     * handover data and leave handover capture to the normal check-in flow.
     */
    public function swap(
        Booking $booking,
        int $toCarId,
        string $swapDate,
        ?string $swapTime,
        array $handover = [],
    ): Booking {
        return DB::transaction(function () use ($booking, $toCarId, $swapDate, $swapTime, $handover) {
            $quote = $this->quote($booking, $toCarId, $swapDate, $swapTime);

            $fromCarId = $booking->car_id;
            $oldTotal = (float) $booking->total_amount;

            $swapOutHandoverId = null;
            $swapInHandoverId = null;

            if ($this->hasSwapHandover($handover)) {
                $swapOut = VehicleHandover::create([
                    'booking_id' => $booking->id,
                    'car_id' => $fromCarId,
                    'type' => 'return',
                    'fuel_level' => (int) $handover['swap_out_fuel'],
                    'odometer' => (float) $handover['swap_out_odometer'],
                    'notes' => $handover['swap_out_notes'] ?? null,
                    'damages' => $this->normalizeDamages($handover['swap_out_damages'] ?? []),
                    'captured_by' => auth()->id(),
                    'captured_at' => now(),
                ]);
                $swapOutHandoverId = $swapOut->id;

                $swapIn = VehicleHandover::create([
                    'booking_id' => $booking->id,
                    'car_id' => $toCarId,
                    'type' => 'pickup',
                    'fuel_level' => (int) $handover['swap_in_fuel'],
                    'odometer' => (float) $handover['swap_in_odometer'],
                    'notes' => $handover['swap_in_notes'] ?? null,
                    'damages' => $this->normalizeDamages($handover['swap_in_damages'] ?? []),
                    'captured_by' => auth()->id(),
                    'captured_at' => now(),
                ]);
                $swapInHandoverId = $swapIn->id;
            }

            $booking->update([
                'car_id' => $toCarId,
                'total_amount' => $quote['new_total_amount'],
            ]);

            $booking->bookingTaxes()->delete();
            foreach ($quote['taxes'] as $item) {
                BookingTax::create([
                    'booking_id' => $booking->id,
                    'tax_id' => $item['id'] ?? null,
                    'tax_desc' => $item['tax_desc'],
                    'amount' => $item['amount'],
                    'add_or_minus' => $item['add_or_minus'],
                ]);
            }

            BookingSwap::create([
                'booking_id' => $booking->id,
                'from_car_id' => $fromCarId,
                'to_car_id' => $toCarId,
                'swap_date' => $swapDate,
                'swap_time' => $swapTime ? substr($swapTime, 0, 5) : null,
                'swap_out_handover_id' => $swapOutHandoverId,
                'swap_in_handover_id' => $swapInHandoverId,
                'from_days' => $quote['from_days'],
                'to_days' => $quote['to_days'],
                'from_subtotal' => $quote['from_subtotal'],
                'to_subtotal' => $quote['to_subtotal'],
                'old_total_amount' => $oldTotal,
                'new_total_amount' => $quote['new_total_amount'],
                'price_delta' => $quote['price_delta'],
                'created_by' => auth()->id(),
            ]);

            \App\Models\AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'booking_swapped',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => 'Vehicle swapped on booking '.$booking->reference_code.' to '
                    .($booking->car?->brand ?? '').' '.($booking->car?->model ?? 'another vehicle')
                    .' from '.$swapDate
                    .' — total '.number_format($oldTotal, 2).' → '.number_format($quote['new_total_amount'], 2)
                    .' ($'.number_format($quote['price_delta'], 2).')',
                'old_values' => [
                    'car_id' => $fromCarId,
                    'total_amount' => $oldTotal,
                ],
                'new_values' => [
                    'car_id' => $toCarId,
                    'total_amount' => $quote['new_total_amount'],
                    'price_delta' => $quote['price_delta'],
                    'swap_out_handover_id' => $swapOutHandoverId,
                    'swap_in_handover_id' => $swapInHandoverId,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $booking->fresh();
        });
    }

    private function assertCanSwap(Booking $booking): void
    {
        if (! in_array($booking->status, ['confirmed', 'active'], true)) {
            throw new BookingSwapException('A vehicle can only be swapped while the rental is confirmed or active.');
        }

        // Block swaps once the rental has been returned. The latest return
        // handover matches the current car only after the final check-in, so a
        // mid-rental swap-out handover on an earlier car never blocks another swap.
        $latestReturn = $booking->returnHandover;
        if ($latestReturn && (int) $latestReturn->car_id === (int) $booking->car_id) {
            throw new BookingSwapException('This rental has already been returned and can no longer be swapped.');
        }
    }

    private function hasSwapHandover(array $handover): bool
    {
        return isset($handover['swap_out_fuel'], $handover['swap_out_odometer'], $handover['swap_in_fuel'], $handover['swap_in_odometer']);
    }

    private function normalizeDamages(array $damages): array
    {
        return array_values(array_filter(
            array_map(
                fn ($damage) => is_array($damage) && ! empty($damage['zone'])
                    ? $damage + ['preexisting' => ! empty($damage['preexisting'])]
                    : $damage,
                $damages,
            ),
            fn ($damage) => is_array($damage) && ! empty($damage['zone']),
        ));
    }

    /**
     * Rebuild the rental as a list of per-car segments and split the current
     * tail segment at the requested swap date into the outgoing car's final
     * segment and the new car's first segment.
     *
     * @return array<int, array{ car: Car, start_date: string, start_time: ?string, end_date: string, end_time: ?string }>
     */
    private function buildSegments(Booking $booking, Car $toCar, string $swapDate, ?string $swapTime): array
    {
        $swaps = $booking->swaps()->with('fromCar')->get();

        $segments = [];
        $boundaryDate = $booking->start_date->format('Y-m-d');
        $boundaryTime = $booking->pickup_time ? substr($booking->pickup_time, 0, 5) : null;

        foreach ($swaps as $swap) {
            $segments[] = [
                'car' => $swap->fromCar,
                'start_date' => $boundaryDate,
                'start_time' => $boundaryTime,
                'end_date' => $swap->swap_date->format('Y-m-d'),
                'end_time' => $swap->swap_time ? substr($swap->swap_time, 0, 5) : null,
            ];
            $boundaryDate = $swap->swap_date->format('Y-m-d');
            $boundaryTime = $swap->swap_time ? substr($swap->swap_time, 0, 5) : null;
        }

        $segments[] = [
            'car' => $booking->car()->firstOrFail(),
            'start_date' => $boundaryDate,
            'start_time' => $boundaryTime,
            'end_date' => $booking->end_date->format('Y-m-d'),
            'end_time' => $booking->return_time ? substr($booking->return_time, 0, 5) : null,
        ];

        $last = array_pop($segments);
        $swapTime = $swapTime ? substr($swapTime, 0, 5) : ($last['start_time'] ?? '00:00');

        $segments[] = [
            'car' => $last['car'],
            'start_date' => $last['start_date'],
            'start_time' => $last['start_time'],
            'end_date' => $swapDate,
            'end_time' => $swapTime,
        ];
        $segments[] = [
            'car' => $toCar,
            'start_date' => $swapDate,
            'start_time' => $swapTime,
            'end_date' => $last['end_date'],
            'end_time' => $last['end_time'],
        ];

        return $segments;
    }

    /**
     * Price each segment at its car's daily rate plus class/location taxes,
     * then merge the per-segment tax rows (summed per tax) so booking_taxes
     * stays a single authoritative breakdown.
     */
    /**
     * Price a vehicle swap using a rate-differential model:
     *
     *   new total = (old car rate × full window days)
     *             + ((new car rate − old car rate) × days remaining after the swap)
     *
     * The original rental is kept as-is for the whole window and only the rate
     * difference for the remaining days is added (or credited when the new car
     * is cheaper). The remaining days are counted strictly from the swap
     * datetime to the return datetime, so a same-day swap at noon covers the
     * whole rest of the window.
     */
    private function priceSegments(Booking $booking, array $segments): array
    {
        $last = $segments[count($segments) - 1];
        $base = $segments[count($segments) - 2];

        $windowDays = RentalDayCalculator::days(
            $booking->start_date->format('Y-m-d'),
            $booking->pickup_time,
            $booking->end_date->format('Y-m-d'),
            $booking->return_time,
        );

        $remainingDays = RentalDayCalculator::days(
            $last['start_date'],
            $last['start_time'],
            $last['end_date'],
            $last['end_time'],
        );

        $baseCar = $base['car'];
        $newCar = $last['car'];

        $baseRate = (float) $baseCar->daily_rate;
        $newRate = (float) $newCar->daily_rate;
        $deltaRate = round($newRate - $baseRate, 2);

        $baseSubtotal = round($baseRate * $windowDays, 2);
        $deltaSubtotal = round($deltaRate * $remainingDays, 2);

        $priced = [
            [
                'car' => $this->carPayload($baseCar),
                'start_date' => $booking->start_date->format('Y-m-d'),
                'end_date' => $booking->end_date->format('Y-m-d'),
                'days' => $windowDays,
                'daily_rate' => $baseRate,
                'subtotal' => $baseSubtotal,
            ],
            [
                'car' => $this->carPayload($newCar),
                'start_date' => $last['start_date'],
                'end_date' => $last['end_date'],
                'days' => $remainingDays,
                'daily_rate' => $deltaRate,
                'subtotal' => $deltaSubtotal,
            ],
        ];

        $mergedTaxes = [];

        $baseTaxResult = $this->taxService->calculate(
            (string) ($baseCar->vehicleClass?->class_no ?? ''),
            $booking->pickup_location_id,
            $windowDays,
            $baseRate,
            $baseSubtotal,
        );

        $deltaTaxResult = $this->taxService->calculate(
            (string) ($newCar->vehicleClass?->class_no ?? ''),
            $booking->pickup_location_id,
            $remainingDays,
            $deltaRate,
            $deltaSubtotal,
        );

        foreach ([$baseTaxResult['taxes'], $deltaTaxResult['taxes']] as $taxList) {
            foreach ($taxList as $tax) {
                $key = ($tax['id'] ?? 'tax').'|'.$tax['tax_desc'].'|'.($tax['add_or_minus'] ? 'add' : 'minus');
                if (! isset($mergedTaxes[$key])) {
                    $mergedTaxes[$key] = [
                        'id' => $tax['id'] ?? null,
                        'tax_desc' => $tax['tax_desc'],
                        'amount' => 0.0,
                        'add_or_minus' => $tax['add_or_minus'],
                    ];
                }
                $mergedTaxes[$key]['amount'] = round($mergedTaxes[$key]['amount'] + (float) $tax['amount'], 2);
            }
        }

        $total = $baseSubtotal + $deltaSubtotal;
        foreach ($mergedTaxes as $tax) {
            $total += $tax['add_or_minus'] ? (float) $tax['amount'] : -(float) $tax['amount'];
        }

        return [
            'segments' => $priced,
            'taxes' => array_values($mergedTaxes),
            'total' => round($total, 2),
        ];
    }

    private function carPayload(Car $car): array
    {
        return [
            'id' => $car->id,
            'brand' => $car->brand,
            'model' => $car->model,
            'year' => $car->year,
            'license_plate' => $car->license_plate,
            'daily_rate' => (float) $car->daily_rate,
            'image_path' => $car->image_path,
            'vehicle_type' => $car->vehicle_type,
        ];
    }
}
