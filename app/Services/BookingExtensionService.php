<?php

namespace App\Services;

use App\Events\BookingCreated;
use App\Exceptions\BookingExtensionException;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Notifications\AdminNewBooking;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BookingExtensionService
{
    public function __construct(
        private TaxCalculationService $taxService,
        private BookingPricingService $pricing,
    ) {}

    /**
     * Compute the price impact of extending a booking's return date/time.
     *
     * The extension is priced as a full-window re-computation (without the
     * original coupon, whose discount stays fixed) so that per-day and
     * per-rental taxes/surcharges are never double-counted. Availability is
     * enforced strictly on the extension window.
     *
     * @param int|null $carId  When provided and different from the booking's car, the quote prices a
     *                         brand-new booking for the extension window [original return → new return]
     *                         on that car; its calendar only needs to be free for that extension window.
     * @return array{
     *     extension_days: int,
     *     daily_rate: float,
     *     extension_subtotal: float,
     *     taxes: array,
     *     total_tax: float,
     *     total_surcharge: float,
     *     additional_total: float,
     *     new_total_amount: float,
     *     current_end_date: string,
     *     current_return_time: ?string,
     *     new_end_date: string,
     *     new_return_time: ?string,
     *     max_extendable_date: ?string,
     *     max_return_time: ?string,
     *     alternate_cars: array,
     *     car_id: int,
     *     is_swap: bool,
     *     car: array,
     * }
     */
    public function quote(Booking $booking, string $newEndDate, ?string $newReturnTime, ?int $carId = null): array
    {
        $this->assertCanExtend($booking);

        $car = $carId
            ? Car::with(['vehicleClass', 'availability'])->findOrFail($carId)
            : $booking->car()->with(['vehicleClass', 'availability'])->firstOrFail();

        $isSwap = (int) $car->id !== (int) $booking->car_id;

        if ($isSwap && ! $car->isAvailable()) {
            throw new BookingExtensionException('That vehicle is currently not available for new bookings.');
        }

        $graceMinutes = $car->getGraceMinutes();

        $currentEnd = $booking->end_date->format('Y-m-d');
        $currentReturnTime = $booking->return_time ? substr($booking->return_time, 0, 5) : '23:59';
        $newReturnTime = $newReturnTime ? substr($newReturnTime, 0, 5) : '23:59';

        if (strtotime($newEndDate) < strtotime($currentEnd)) {
            throw new BookingExtensionException(
                'The new return date must be on or after the current return date.'
            );
        }

        if ($newEndDate === $currentEnd && $newReturnTime <= $currentReturnTime) {
            throw new BookingExtensionException(
                'The new return time must be after the current return time.'
            );
        }

        $maxDate = $this->maxExtendableDate($booking, $car);
        $maxReturnTime = $this->maxReturnTime($booking, $car);

        if ($maxDate && strtotime($newEndDate) > strtotime($maxDate)) {
            $alternates = $this->findAlternateCars($booking, $newEndDate, $newReturnTime);

            if ($isSwap) {
                throw new BookingExtensionException(
                    'That vehicle is not available for the requested extension period. '
                    ."You can extend your rental until {$maxDate} before it is reserved by another customer.",
                    $maxDate,
                    $alternates,
                );
            }

            throw new BookingExtensionException(
                'This car is already reserved for part of the requested period. '
                ."You can extend your rental until {$maxDate}, before the next reservation begins.",
                $maxDate,
                $alternates,
            );
        }

        $conflict = $this->conflictingBooking($booking, $car, $newEndDate, $newReturnTime, $graceMinutes);
        if ($conflict) {
            $alternates = $this->findAlternateCars($booking, $newEndDate, $newReturnTime);

            if ($isSwap) {
                throw new BookingExtensionException(
                    'That vehicle is not available for the requested extension period.',
                    $maxDate,
                    $alternates,
                );
            }

            throw new BookingExtensionException(
                'This car is already reserved by another customer from '
                .$conflict->start_date->format('Y-m-d').' to '.$conflict->end_date->format('Y-m-d')
                .($maxDate ? ". You can extend your rental until {$maxDate}." : '.'),
                $maxDate,
                $alternates,
            );
        }

        $pickupLocationId = $booking->pickup_location_id;
        $dailyRate = (float) $car->daily_rate;

        // Switching cars = a brand-new reservation for the extension window
        // [original return → new return] on the other car. Price that window in
        // full (its own rate, taxes, no coupon) — the original booking is untouched.
        if ($isSwap) {
            $bookingStart = $currentEnd;
            $bookingStartTime = $booking->return_time ? substr($booking->return_time, 0, 5) : '23:59';
            $bookingDays = RentalDayCalculator::days($bookingStart, $bookingStartTime, $newEndDate, $newReturnTime);
            $subtotal = round($dailyRate * $bookingDays, 2);

            $taxResult = $this->taxService->calculate(
                (string) ($car->vehicleClass?->class_no ?? ''),
                $pickupLocationId,
                $bookingDays,
                $dailyRate,
                $subtotal,
            );

            $newTotal = round(
                $subtotal
                    + (float) $taxResult['total_tax']
                    + (float) $taxResult['total_surcharge']
                    - (float) $taxResult['total_discount'],
                2,
            );

            return [
                'extension_days' => $bookingDays,
                'daily_rate' => $dailyRate,
                'extension_subtotal' => $subtotal,
                'taxes' => $taxResult['taxes'],
                'total_tax' => (float) $taxResult['total_tax'],
                'total_surcharge' => (float) $taxResult['total_surcharge'],
                'additional_total' => $newTotal,
                'new_total_amount' => $newTotal,
                'current_end_date' => $currentEnd,
                'current_return_time' => $booking->return_time,
                'new_end_date' => $newEndDate,
                'new_return_time' => $newReturnTime,
                'max_extendable_date' => $maxDate,
                'max_return_time' => $maxReturnTime,
                'alternate_cars' => [],
                'car_id' => (int) $car->id,
                'is_swap' => true,
                'car' => [
                    'id' => (int) $car->id,
                    'brand' => $car->brand,
                    'model' => $car->model,
                    'year' => $car->year,
                    'daily_rate' => $dailyRate,
                    'image_path' => $car->image_path,
                    'vehicle_type' => $car->vehicle_type,
                ],
            ];
        }

        $startDate = $booking->start_date->format('Y-m-d');
        $pickupTime = $booking->pickup_time ? substr($booking->pickup_time, 0, 5) : '00:00';

        $originalDays = RentalDayCalculator::days($startDate, $pickupTime, $currentEnd, $currentReturnTime);
        $newDays = RentalDayCalculator::days($startDate, $pickupTime, $newEndDate, $newReturnTime);

        $newSubtotal = round($dailyRate * $newDays, 2);

        $taxResult = $this->taxService->calculate(
            (string) ($car->vehicleClass?->class_no ?? ''),
            $pickupLocationId,
            $newDays,
            $dailyRate,
            $newSubtotal,
        );

        $newTotal = round(
            $newSubtotal
                + (float) $taxResult['total_tax']
                + (float) $taxResult['total_surcharge']
                - (float) $taxResult['total_discount']
                - (float) ($booking->couponUsage?->discount_amount ?? 0),
            2,
        );

        $oldTotal = (float) $booking->total_amount;
        $additionalTotal = round(max(0, $newTotal - $oldTotal), 2);

        return [
            'extension_days' => max(0, $newDays - $originalDays),
            'daily_rate' => $dailyRate,
            'extension_subtotal' => round(max(0, $newSubtotal - ($dailyRate * $originalDays)), 2),
            'taxes' => $taxResult['taxes'],
            'total_tax' => (float) $taxResult['total_tax'],
            'total_surcharge' => (float) $taxResult['total_surcharge'],
            'additional_total' => $additionalTotal,
            'new_total_amount' => $newTotal,
            'current_end_date' => $currentEnd,
            'current_return_time' => $booking->return_time,
            'new_end_date' => $newEndDate,
            'new_return_time' => $newReturnTime,
            'max_extendable_date' => $maxDate,
            'max_return_time' => $maxReturnTime,
            'alternate_cars' => [],
            'car_id' => (int) $car->id,
            'is_swap' => false,
            'car' => [
                'id' => (int) $car->id,
                'brand' => $car->brand,
                'model' => $car->model,
                'year' => $car->year,
                'daily_rate' => $dailyRate,
                'image_path' => $car->image_path,
                'vehicle_type' => $car->vehicle_type,
            ],
        ];
    }

    /**
     * Whether a booking can currently be extended, plus the farthest return
     * date allowed by the car's reservation calendar.
     *
     * @return array{ allowed: bool, message: ?string, max_extendable_date: ?string, max_return_time: ?string }
     */
    public function canExtend(Booking $booking): array
    {
        try {
            $this->assertCanExtend($booking);
        } catch (\Throwable $e) {
            return [
                'allowed' => false,
                'message' => $e->getMessage(),
                'max_extendable_date' => null,
                'max_return_time' => null,
            ];
        }

        $car = $booking->car()->firstOrFail();

        return [
            'allowed' => true,
            'message' => null,
            'max_extendable_date' => $this->maxExtendableDate($booking, $car),
            'max_return_time' => $this->maxReturnTime($booking, $car),
        ];
    }

    /**
     * Apply a same-car extension inside a transaction: update the return
     * date/time, re-compute the total and replace the tax breakdown, then audit.
     */
    public function extend(Booking $booking, string $newEndDate, ?string $newReturnTime): Booking
    {
        return DB::transaction(function () use ($booking, $newEndDate, $newReturnTime) {
            $quote = $this->quote($booking, $newEndDate, $newReturnTime);

            $oldEnd = $booking->end_date->format('Y-m-d');
            $oldReturnTime = $booking->return_time;
            $oldTotal = (float) $booking->total_amount;

            $booking->update([
                'end_date' => $newEndDate,
                'return_time' => $newReturnTime ? substr($newReturnTime, 0, 5) : $booking->return_time,
                'total_amount' => $quote['new_total_amount'],
            ]);

            // Replace the tax breakdown so per-day/per-rental taxes reflect the
            // whole extended window without double counting flat surcharges.
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

            AuditLog::create([
                'user_id' => request()->user()?->id,
                'action' => 'booking_extended',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => "Booking {$booking->reference_code} extended from {$oldEnd}"
                    .($oldReturnTime ? ' '.substr($oldReturnTime, 0, 5) : '')
                    ." to {$newEndDate}"
                    .($newReturnTime ? ' '.substr($newReturnTime, 0, 5) : '')
                    .' — additional $'.number_format($quote['additional_total'], 2)
                    .' (total '.$oldTotal.' → '.$booking->total_amount.')',
                'old_values' => [
                    'end_date' => $oldEnd,
                    'return_time' => $oldReturnTime,
                    'total_amount' => $oldTotal,
                ],
                'new_values' => [
                    'end_date' => $newEndDate,
                    'return_time' => $booking->return_time,
                    'total_amount' => $booking->total_amount,
                    'additional_amount' => $quote['additional_total'],
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            return $booking->fresh();
        });
    }

    /**
     * Create a brand-new booking on another car for the extension window
     * [original return → new return], leaving the original booking untouched.
     * Reuses the original contact (guest/user/driver) and locations, prices the
     * new window independently, and starts as a normal pending reservation so it
     * flows through the same confirmation/payment pipeline as any new booking.
     */
    public function rebook(Booking $original, int $newCarId, string $newEndDate, ?string $newReturnTime): Booking
    {
        return DB::transaction(function () use ($original, $newCarId, $newEndDate, $newReturnTime) {
            $this->assertCanExtend($original);

            $car = Car::with(['vehicleClass', 'availability'])->findOrFail($newCarId);

            if (! $car->isAvailable()) {
                throw new BookingExtensionException('That vehicle is currently not available for new bookings.');
            }

            $graceMinutes = $car->getGraceMinutes();
            $newReturnTime = $newReturnTime ? substr($newReturnTime, 0, 5) : null;

            $maxDate = $this->maxExtendableDate($original, $car);
            if ($maxDate && strtotime($newEndDate) > strtotime($maxDate)) {
                throw new BookingExtensionException(
                    'That vehicle is not available for the requested extension period. '
                    ."You can extend your rental until {$maxDate} before it is reserved by another customer.",
                    $maxDate,
                );
            }

            $conflict = $this->conflictingBooking($original, $car, $newEndDate, $newReturnTime, $graceMinutes);
            if ($conflict) {
                throw new BookingExtensionException(
                    'That vehicle is already reserved for part of the requested extension period.',
                    $maxDate,
                );
            }

            $price = $this->pricing->calculate(
                $car,
                $original->end_date->format('Y-m-d'),
                $original->return_time ? substr($original->return_time, 0, 5) : null,
                $newEndDate,
                $newReturnTime,
                $original->pickup_location_id,
                null,
            );

            $booking = Booking::create([
                'user_id' => $original->user_id,
                'guest_id' => $original->guest_id,
                'driver_id' => $original->driver_id,
                'car_id' => $newCarId,
                'start_date' => $original->end_date,
                'end_date' => $newEndDate,
                'pickup_time' => $original->return_time,
                'return_time' => $newReturnTime ? $newReturnTime.':00' : null,
                'pickup_location_id' => $original->pickup_location_id,
                'return_location_id' => $original->return_location_id,
                'total_amount' => $price['total'],
                'status' => 'pending',
                'notes' => 'Extension of booking '.$original->reference_code.' (original booking unchanged).',
            ]);

            foreach ($price['taxes'] as $item) {
                BookingTax::create([
                    'booking_id' => $booking->id,
                    'tax_id' => $item['id'] ?? null,
                    'tax_desc' => $item['tax_desc'],
                    'amount' => $item['amount'],
                    'add_or_minus' => $item['add_or_minus'],
                ]);
            }

            AuditLog::create([
                'user_id' => request()->user()?->id,
                'action' => 'booking_rebooked',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => "New booking {$booking->reference_code} created as extension of {$original->reference_code} "
                    ."on {$car->brand} {$car->model} for {$original->end_date->format('Y-m-d')} → {$newEndDate} "
                    .'— total $'.number_format($booking->total_amount, 2),
                'old_values' => [
                    'source_booking_id' => $original->id,
                    'source_reference' => $original->reference_code,
                ],
                'new_values' => [
                    'car_id' => $newCarId,
                    'total_amount' => (float) $booking->total_amount,
                ],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            try {
                event(new BookingCreated($booking));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed for rebooked booking #'.$booking->id.': '.$e->getMessage());
            }

            AdminNotificationService::send(new AdminNewBooking($booking));

            // Email the customer a confirmation. Always send it for guests and
            // for admin-initiated rebooks; only skip it when the booking owner is
            // performing the switch themselves (they already see the result live).
            $recipient = $original->guest?->email ?? $original->user?->email;
            $actorIsOwner = auth()->check()
                && $original->user_id
                && $original->user_id === auth()->id()
                && ! auth()->user()->isAdmin();

            if ($recipient && ! $actorIsOwner) {
                try {
                    Mail::to($recipient)->queue(new GuestBookingConfirmation($booking));
                } catch (\Throwable $e) {
                    Log::warning('Confirmation email failed for rebooked booking #'.$booking->id.': '.$e->getMessage());
                }
            }

            return $booking->fresh();
        });
    }

    private function assertCanExtend(Booking $booking): void
    {
        if (! in_array($booking->status, ['confirmed', 'active'], true)) {
            abort(422, 'A rental can only be extended while it is confirmed or active.');
        }

        if ($booking->returnHandover()->exists()) {
            abort(422, 'This rental has already been returned and can no longer be extended.');
        }
    }

    /**
     * The first confirmed/active reservation for the car starting on or after
     * the current rental's end date, or null when the car is free from here on.
     */
    private function nextReservation(Booking $booking, Car $car): ?Booking
    {
        $currentEnd = $booking->end_date->format('Y-m-d');

        return Booking::where('car_id', $car->id)
            ->where('id', '!=', $booking->id)
            ->whereIn('status', ['confirmed', 'active'])
            ->where('start_date', '>=', $currentEnd)
            ->orderBy('start_date')
            ->orderBy('pickup_time')
            ->first(['start_date', 'pickup_time', 'end_date', 'return_time']);
    }

    /**
     * The last date (inclusive) the car may be returned on before the next
     * reservation starts. Returns null when there is no known conflict.
     */
    private function maxExtendableDate(Booking $booking, Car $car): ?string
    {
        $currentEnd = $booking->end_date->format('Y-m-d');
        $next = $this->nextReservation($booking, $car);

        if (! $next) {
            return null;
        }

        $start = $next->start_date->format('Y-m-d');

        // Next reservation begins on the same day the current rental ends — the
        // car can still be returned that day before the next pickup time, so
        // the cap is the current end date itself (times are enforced strictly).
        if ($start === $currentEnd) {
            return $currentEnd;
        }

        return Carbon::parse($start)->subDay()->format('Y-m-d');
    }

    /**
     * Latest allowed return time (HH:MM) when the rental is extended only
     * within its current end date: the next reservation's pickup time on that
     * same day. Returns null when there is no same-day successor, meaning the
     * return time is unconstrained (the date cap governs instead).
     */
    private function maxReturnTime(Booking $booking, Car $car): ?string
    {
        $currentEnd = $booking->end_date->format('Y-m-d');
        $next = $this->nextReservation($booking, $car);

        if ($next && $next->start_date->format('Y-m-d') === $currentEnd && $next->pickup_time) {
            return substr($next->pickup_time, 0, 5);
        }

        return null;
    }

    /**
     * Returns the first confirmed/active booking that overlaps the extension
     * window [current return → new return], or null when the car is free. The
     * same window applies whether the car is the original one or an alternate,
     * because a rebooked car only needs to be free from the switchover onward.
     */
    private function conflictingBooking(Booking $booking, Car $car, string $newEndDate, string $newReturnTime, int $graceMinutes): ?Booking
    {
        $start = $booking->end_date->format('Y-m-d').' '.($booking->return_time ?: '00:00:00');

        return Booking::overlappingBetween(
            $car->id,
            $start,
            $newEndDate.' '.($newReturnTime ? $newReturnTime.':00' : '23:59:59'),
            $graceMinutes,
            $booking->id,
        )->first();
    }

    /**
     * Other available cars that are free for the requested extension window
     * [original return → new return], offered as switchable alternatives when
     * the current car is blocked. Every available car is considered (not a
     * pre-truncated subset), ordered so cars at the booking's pickup location
     * come first and then by daily rate. Each car is checked with its own
     * grace minutes.
     */
    private function findAlternateCars(Booking $booking, string $newEndDate, string $newReturnTime): array
    {
        $extensionStart = $booking->end_date->format('Y-m-d').' '.($booking->return_time ?: '00:00:00');
        $newReturn = $newEndDate.' '.($newReturnTime ? $newReturnTime.':00' : '23:59:59');

        return Car::with('vehicleClass')
            ->available()
            ->where('id', '!=', $booking->car_id)
            ->orderByRaw('location_id = ? DESC', [$booking->pickup_location_id])
            ->orderBy('daily_rate')
            ->orderBy('id')
            ->get()
            ->filter(function (Car $car) use ($booking, $extensionStart, $newReturn) {
                $overlap = Booking::overlappingBetween(
                    $car->id,
                    $extensionStart,
                    $newReturn,
                    $car->getGraceMinutes(),
                    $booking->id,
                )->exists();

                return ! $overlap;
            })
            ->values()
            ->map(fn (Car $car) => [
                'id' => $car->id,
                'brand' => $car->brand,
                'model' => $car->model,
                'year' => $car->year,
                'daily_rate' => (float) $car->daily_rate,
                'image_path' => $car->image_path,
                'vehicle_type' => $car->vehicle_type,
            ])
            ->toArray();
    }
}
