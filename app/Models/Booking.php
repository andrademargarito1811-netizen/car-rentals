<?php

namespace App\Models;

use Database\Factories\BookingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'guest_id', 'car_id', 'reference_code', 'start_date', 'end_date',
        'pickup_time', 'return_time',
        'pickup_location_id', 'return_location_id',
        'total_amount', 'status', 'notes'
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'pickup_time' => 'string',
            'return_time' => 'string',
            'total_amount' => 'decimal:2',
        ];
    }

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guest(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Guest::class, 'guest_id', 'guest_id');
    }

    public function car(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function payment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Payment::class)->ofMany('id', 'max');
    }

    public function completedPayments(): \Illuminate\Database\Eloquent\Relations\HasMany
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

    public function couponUsage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(CouponUsage::class);
    }

    public function bookingTaxes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(BookingTax::class);
    }

    public function pickupLocation(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(VehicleLocation::class, 'pickup_location_id', 'location_id');
    }

    public function returnLocation(): \Illuminate\Database\Eloquent\Relations\BelongsTo
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

    public function review(): \Illuminate\Database\Eloquent\Relations\HasOne
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
            ->whereIn('status', ['confirmed', 'active'])
            ->whereRaw('CAST(start_date AS DATETIME) + COALESCE(CAST(pickup_time AS DATETIME), \'00:00:00\') < ?', [$endDateTime])
            ->whereRaw('DATEADD(MINUTE, ?, CAST(end_date AS DATETIME) + COALESCE(CAST(return_time AS DATETIME), \'23:59:59\')) > ?', [$graceMinutes, $startDateTime]);

        if ($excludeBookingId !== null) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query;
    }
}
