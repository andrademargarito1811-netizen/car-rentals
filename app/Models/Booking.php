<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

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
        return $this->hasOne(VehicleHandover::class)->where('type', 'pickup');
    }

    public function returnHandover(): HasOne
    {
        return $this->hasOne(VehicleHandover::class)->where('type', 'return');
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
        } else {
            $query->whereRaw('TIMESTAMP(start_date, COALESCE(pickup_time, \'00:00:00\')) < ?', [$endDateTime])
                ->whereRaw('TIMESTAMPADD(MINUTE, ?, TIMESTAMP(end_date, COALESCE(return_time, \'23:59:59\'))) > ?', [$graceMinutes, $startDateTime]);
        }

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query;
    }
}
