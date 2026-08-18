<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\RentalDayCalculator;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'guest_id', 'driver_id', 'car_id', 'reference_code', 'start_date', 'end_date',
        'pickup_time', 'return_time',
        'pickup_location_id', 'return_location_id',
        'total_amount', 'status', 'notes', 'handover_charges', 'reminder_sent',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'pickup_time' => 'string',
            'return_time' => 'string',
            'total_amount' => 'decimal:2',
            'handover_charges' => 'array',
            'reminder_sent' => 'array',
        ];
    }

    public function reminderSent(string $type, ?string $date = null): bool
    {
        $sent = $this->reminder_sent ?? [];
        $flag = $date ? "{$type}:{$date}" : $type;

        return in_array($flag, $sent, true);
    }

    public function markReminderSent(string $type, ?string $date = null): void
    {
        $sent = $this->reminder_sent ?? [];
        $flag = $date ? "{$type}:{$date}" : $type;
        $sent[] = $flag;

        $this->update(['reminder_sent' => array_values(array_unique($sent))]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class, 'guest_id', 'guest_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class, 'driver_id', 'driver_id');
    }

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function handovers(): HasMany
    {
        return $this->hasMany(VehicleHandover::class);
    }

    public function pickupHandover(): HasOne
    {
        return $this->hasOne(VehicleHandover::class)
            ->where('type', 'pickup')
            ->orderByDesc('id');
    }

    public function returnHandover(): HasOne
    {
        return $this->hasOne(VehicleHandover::class)
            ->where('type', 'return')
            ->orderByDesc('id');
    }

    public function swaps(): HasMany
    {
        return $this->hasMany(BookingSwap::class)->orderBy('swap_date')->orderBy('id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class)->ofMany('id', 'max');
    }

    public function completedPayments(): HasMany
    {
        return $this->hasMany(Payment::class)->where('payment_status', 'completed');
    }

    public function totalPaid(): float
    {
        return (float) $this->completedPayments()->sum('amount');
    }

    public function remainingBalance(): float
    {
        return max(0, (float) $this->total_amount - $this->totalPaid());
    }

    public function hasDownpayment(): bool
    {
        return $this->payments()->where('type', 'downpayment')->where('payment_status', 'completed')->exists();
    }

    public function isFullyPaid(): bool
    {
        return $this->remainingBalance() <= 0;
    }

    public function hasRefunds(): bool
    {
        return $this->payments()
            ->where('type', 'refund')
            ->where('payment_status', 'completed')
            ->exists();
    }

    public function isFullyRefunded(): bool
    {
        return $this->hasRefunds() && $this->totalPaid() <= 0;
    }

    public function couponUsage(): HasOne
    {
        return $this->hasOne(CouponUsage::class);
    }

    public function bookingTaxes(): HasMany
    {
        return $this->hasMany(BookingTax::class);
    }

    public function extraCharges(): HasMany
    {
        return $this->hasMany(BookingExtraCharge::class);
    }

    public function extraChargesTotal(): float
    {
        $total = 0.0;

        foreach ($this->extraCharges as $charge) {
            $amount = (float) $charge->amount + (float) $charge->tax_amount;
            $total += $charge->isAdd() ? $amount : -$amount;
        }

        return round($total, 2);
    }

    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(VehicleLocation::class, 'pickup_location_id', 'location_id');
    }

    public function returnLocation(): BelongsTo
    {
        return $this->belongsTo(VehicleLocation::class, 'return_location_id', 'location_id');
    }

    protected static function boot(): void
    {
        parent::boot();

        static::created(function (self $booking) {
            if (empty($booking->reference_code)) {
                $booking->syncOriginal();
                $booking->reference_code = static::generateReferenceCode($booking);
                $booking->saveQuietly();
            }
        });
    }

    protected static function generateReferenceCode(self $booking): string
    {
        $year = $booking->created_at->format('Y');
        $sequence = str_pad((string) $booking->id, 4, '0', STR_PAD_LEFT);
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $random = '';

        for ($i = 0; $i < 6; $i++) {
            $random .= $characters[random_int(0, strlen($characters) - 1)];
        }

        return "{$year}{$sequence}{$random}";
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['confirmed', 'active']);
    }

    public function scopeOverlappingBetween($query, int $carId, string $startDateTime, string $endDateTime, int $graceMinutes, ?int $excludeBookingId = null)
    {
        $query->where('car_id', $carId)
            ->whereIn('status', ['confirmed', 'active']);

        if (DB::getDriverName() === 'sqlsrv') {
            $query->whereRaw('CAST(start_date AS DATETIME) + COALESCE(CAST(pickup_time AS DATETIME), \'00:00:00\') < ?', [$endDateTime])
                ->whereRaw('DATEADD(MINUTE, ?, CAST(end_date AS DATETIME) + COALESCE(CAST(return_time AS DATETIME), \'23:59:59\')) > ?', [$graceMinutes, $startDateTime]);
        } elseif (DB::getDriverName() === 'sqlite') {
            $query->whereRaw('julianday(start_date || \' \' || COALESCE(pickup_time, \'00:00:00\')) < julianday(?)', [$endDateTime])
                ->whereRaw('julianday(end_date || \' \' || COALESCE(return_time, \'23:59:59\')) + ? > julianday(?)', [$graceMinutes / 1440.0, $startDateTime]);
        } else {
            $query->whereRaw('TIMESTAMP(start_date, COALESCE(pickup_time, \'00:00:00\')) < ?', [$endDateTime])
                ->whereRaw('TIMESTAMPADD(MINUTE, ?, TIMESTAMP(end_date, COALESCE(return_time, \'23:59:59\'))) > ?', [$graceMinutes, $startDateTime]);
        }

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query;
    }

    /**
     * The original booking this one was created from as a rebook/extension
     * (alternate car switch during an extension), or null when this booking
     * is not the product of a rebook.
     */
    public function extensionSource(): ?self
    {
        $log = AuditLog::where('model_type', static::class)
            ->where('model_id', $this->id)
            ->where('action', 'booking_rebooked')
            ->orderByDesc('id')
            ->first();

        $sourceId = $log?->old_values['source_booking_id'] ?? null;

        if (! $sourceId) {
            return null;
        }

        return static::query()->with(['car'])->find((int) $sourceId);
    }

    /**
     * New bookings created as rebook/extension of this one (guests switching to
     * another vehicle keep their original booking untouched and gain a new one).
     */
    public function extensionChildren(): Collection
    {
        $ids = AuditLog::where('model_type', static::class)
            ->where('action', 'booking_rebooked')
            ->where('old_values->source_booking_id', $this->id)
            ->orderByDesc('id')
            ->pluck('model_id')
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return collect();
        }

        return static::query()->with(['car'])->whereIn('id', $ids)->orderBy('id')->get();
    }

    /**
     * The rental split into per-car segments when the guest switched vehicles
     * mid-rental. Each segment describes the car, the days it was used and its
     * share of the rental. Without any swaps a single segment covers the whole
     * window. Used by the invoice and the booking pages to show what was driven.
     *
     * @return array<int, array{ car: array, start_date: string, end_date: string, days: int, daily_rate: float, subtotal: float }>
     */
    public function swapSegments(): array
    {
        $swaps = $this->swaps()->with(['fromCar', 'toCar'])->get();
        $startDate = $this->start_date->format('Y-m-d');

        if ($swaps->isEmpty()) {
            $days = RentalDayCalculator::days(
                $this->start_date->format('Y-m-d'),
                $this->pickup_time,
                $this->end_date->format('Y-m-d'),
                $this->return_time,
            );
            $rate = (float) ($this->car?->daily_rate ?? 0);

            return [[
                'car' => $this->car ? [
                    'id' => $this->car->id,
                    'brand' => $this->car->brand,
                    'model' => $this->car->model,
                    'year' => $this->car->year,
                    'license_plate' => $this->car->license_plate,
                    'daily_rate' => (float) $this->car->daily_rate,
                ] : null,
                'start_date' => $startDate,
                'end_date' => $this->end_date->format('Y-m-d'),
                'days' => $days,
                'daily_rate' => $rate,
                'subtotal' => round($rate * $days, 2),
            ]];
        }

        $lastSwap = $swaps->last();
        $fromCar = $lastSwap->fromCar;
        $toCar = $lastSwap->toCar;

        $fromDays = (int) $lastSwap->from_days;
        $toDays = (int) $lastSwap->to_days;
        $fromSubtotal = (float) $lastSwap->from_subtotal;
        $toSubtotal = (float) $lastSwap->to_subtotal;

        // The pricing model for swaps is a rate-differential: the outgoing car
        // is billed at its rate for the whole window (base), and the rate
        // difference × remaining days is added (or credited) on the new car.
        // Derive per-day rates from the stored subtotals so the display always
        // reconciles with the booked total.
        $fromRate = $fromDays > 0 ? round($fromSubtotal / $fromDays, 2) : 0.0;
        $toRate = $toDays > 0 ? round($toSubtotal / $toDays, 2) : 0.0;

        return [
            [
                'car' => $fromCar ? [
                    'id' => $fromCar->id,
                    'brand' => $fromCar->brand,
                    'model' => $fromCar->model,
                    'year' => $fromCar->year,
                    'license_plate' => $fromCar->license_plate,
                    'daily_rate' => (float) $fromCar->daily_rate,
                ] : null,
                'start_date' => $startDate,
                'end_date' => $this->end_date->format('Y-m-d'),
                'days' => $fromDays,
                'daily_rate' => $fromRate,
                'subtotal' => $fromSubtotal,
            ],
            [
                'car' => $toCar ? [
                    'id' => $toCar->id,
                    'brand' => $toCar->brand,
                    'model' => $toCar->model,
                    'year' => $toCar->year,
                    'license_plate' => $toCar->license_plate,
                    'daily_rate' => (float) $toCar->daily_rate,
                ] : null,
                'start_date' => $startDate,
                'end_date' => $this->end_date->format('Y-m-d'),
                'days' => $toDays,
                'daily_rate' => $toRate,
                'subtotal' => $toSubtotal,
            ],
        ];
    }

    /**
     * A chronological activity feed for the booking: creation, status changes,
     * extensions/rebooks, payments & refunds, and vehicle handovers. Each entry
     * is a flat array the frontend renders as a timeline.
     */
    public function activityTimeline(): Collection
    {
        $events = collect();

        $events->push([
            'id' => 'created',
            'type' => 'created',
            'title' => 'Reservation created',
            'description' => 'Booking '.($this->reference_code ?? '#'.$this->id).' was created.',
            'at' => $this->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'user' => null,
        ]);

        // Booking-scoped audit entries (creation is covered above, skip it here).
        $logs = AuditLog::where('model_type', static::class)
            ->where('model_id', $this->id)
            ->where('action', '!=', 'booking_created')
            ->with('user')
            ->get();

        foreach ($logs as $log) {
            $events->push($this->timelineEventFromAuditLog($log));
        }

        // Rebooks that grew out of this booking (their audit entries point at the child).
        $childLogs = AuditLog::where('model_type', static::class)
            ->where('action', 'booking_rebooked')
            ->where('old_values->source_booking_id', $this->id)
            ->with('user')
            ->get();

        foreach ($childLogs as $log) {
            $child = static::query()->with(['car'])->find((int) $log->model_id);
            $events->push([
                'id' => 'rebook-'.$log->id,
                'type' => 'rebook',
                'title' => 'Extended into a new reservation',
                'description' => $child
                    ? 'Created reservation #'.$child->reference_code.' on '.($child->car?->brand ?? '').' '.($child->car?->model ?? 'another vehicle').'.'
                    : $log->description,
                'at' => $log->created_at?->toIso8601String(),
                'user' => $log->user?->name,
                'related_booking_id' => $child?->id,
                'related_reference' => $child?->reference_code,
            ]);
        }

        // Payments and refunds.
        foreach ($this->payments as $payment) {
            $isRefund = $payment->type === 'refund';
            $events->push([
                'id' => 'payment-'.$payment->id,
                'type' => $isRefund ? 'refund' : 'payment',
                'title' => $isRefund ? 'Refund recorded' : 'Payment recorded',
                'description' => ($isRefund ? 'Refund of ' : 'Payment of ').'$'.number_format(abs((float) $payment->amount), 2)
                    .($payment->payment_method ? ' via '.$payment->payment_method : '')
                    .($payment->transaction_id ? ' — '.$payment->transaction_id : ''),
                'at' => $payment->created_at?->toIso8601String(),
                'user' => null,
                'amount' => (float) $payment->amount,
            ]);
        }

        // Vehicle handovers.
        if ($this->pickupHandover) {
            $h = $this->pickupHandover;
            $events->push($this->handoverEvent('checkout', 'Vehicle checked out', $h));
        }

        if ($this->returnHandover) {
            $h = $this->returnHandover;
            $events->push($this->handoverEvent('checkin', 'Vehicle returned', $h));
        }

        return $events
            ->filter(fn ($e) => ! empty($e['at']))
            ->sortByDesc('at')
            ->values();
    }

    private function timelineEventFromAuditLog(AuditLog $log): array
    {
        $title = match ($log->action) {
            'booking_status_updated', 'status_updated' => 'Status updated',
            'booking_extended' => 'Rental extended',
            'booking_rebooked' => 'Vehicle switched',
            'booking_swapped' => 'Vehicle swapped',
            'booking_modified' => 'Booking modified',
            'booking_rescheduled' => 'Booking rescheduled',
            'booking_cancelled' => 'Booking cancelled',
            'booking_auto_cancelled' => 'Booking auto-cancelled',
            'extra_charges_applied' => 'Extra charges applied',
            default => 'Activity',
        };

        return [
            'id' => 'audit-'.$log->id,
            'type' => $this->timelineTypeFor($log->action),
            'title' => $title,
            'description' => $log->description,
            'at' => $log->created_at?->toIso8601String(),
            'user' => $log->user?->name,
        ];
    }

    private function timelineTypeFor(string $action): string
    {
        return match ($action) {
            'booking_status_updated', 'status_updated' => 'status',
            'booking_extended' => 'extension',
            'booking_rebooked' => 'rebook',
            'booking_swapped' => 'swap',
            'booking_modified' => 'modified',
            'booking_rescheduled' => 'rescheduled',
            'booking_cancelled', 'booking_auto_cancelled' => 'cancelled',
            'extra_charges_applied' => 'charges',
            default => 'other',
        };
    }

    private function handoverEvent(string $type, string $title, VehicleHandover $handover): array
    {
        $bits = [];
        if ($handover->odometer !== null) {
            $bits[] = number_format((float) $handover->odometer).' km on the odometer';
        }
        if ($handover->fuel_level !== null) {
            $bits[] = 'fuel '.$handover->fuel_level.'/8';
        }

        return [
            'id' => 'handover-'.$handover->id,
            'type' => $type,
            'title' => $title,
            'description' => 'Handover recorded'.($bits ? ' — '.implode(', ', $bits).'.' : '.'),
            'at' => ($handover->captured_at ?? $handover->created_at)?->toIso8601String(),
            'user' => $handover->capturedBy?->name,
        ];
    }
}
