<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Car extends Model
{
    use HasFactory;

    protected $table = 'tblcars';

    protected $fillable = [
        'location_id', 'stock_number', 'license_plate', 'vin',
        'brand', 'model', 'year', 'vehicle_doors', 'color',
        'seats', 'baggage_capacity', 'maximum_weight', 'class_id',
        'daily_rate', 'sale_date', 'sale_price', 'sold_to',
        'engine', 'transmission', 'fuel_type', 'fuel_charges',
        'fuel_consumption', 'co2_emission',
        'free_km_per_day', 'additional_km_rate', 'fuel_tank_capacity',
        'availability_id', 'air_conditioned',
        'description', 'image_path',
    ];

    protected $appends = ['vehicle_type', 'grace_minutes', 'avg_rating', 'ratings_count'];

    public function getVehicleTypeAttribute(): ?string
    {
        return $this->vehicleClass?->class_desc;
    }

    public function getGraceMinutesAttribute(): int
    {
        return $this->getGraceMinutes();
    }

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'air_conditioned' => 'boolean',
            'sale_date' => 'date',
            'location_id' => 'integer',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'car_id', 'id');
    }

    public function getAvgRatingAttribute(): float
    {
        if (array_key_exists('reviews_avg_rating', $this->attributes)) {
            return (float) $this->attributes['reviews_avg_rating'];
        }
        if ($this->relationLoaded('reviews')) {
            return (float) ($this->reviews->filter(fn ($r) => $r->rating > 0)->avg('rating') ?? 0);
        }

        return (float) ($this->attributes['avg_rating'] ?? 0);
    }

    public function getRatingsCountAttribute(): int
    {
        if (array_key_exists('reviews_count', $this->attributes)) {
            return (int) $this->attributes['reviews_count'];
        }
        if ($this->relationLoaded('reviews')) {
            return $this->reviews->where('rating', '>', 0)->count();
        }

        return (int) ($this->attributes['ratings_count'] ?? 0);
    }

    public function scopeWithReviewStats($query)
    {
        return $query->withAvg(['reviews' => fn ($q) => $q->where('rating', '>', 0)->where('is_approved', true)], 'rating')
            ->withCount(['reviews' => fn ($q) => $q->where('rating', '>', 0)->where('is_approved', true)]);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(VehicleLocation::class, 'location_id', 'location_id');
    }

    public function vehicleClass(): BelongsTo
    {
        return $this->belongsTo(VehicleClass::class, 'class_id', 'class_no');
    }

    public function availability(): BelongsTo
    {
        return $this->belongsTo(VehicleAvailability::class, 'availability_id', 'available_id');
    }

    public function getStatusAttribute(): string
    {
        return $this->availability?->available_desc ? strtolower($this->availability->available_desc) : 'unknown';
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function scopeAvailable($query)
    {
        return $query->whereHas('availability', fn ($q) => $q->where('available_desc', 'available'));
    }

    public function getGraceMinutes(): int
    {
        return $this->vehicleClass?->grace_minutes ?? config('reservation.default_grace_minutes', 30);
    }

    public function bookedDates(int $days = 60): array
    {
        $today = now()->startOfDay();
        $end = now()->addDays($days)->endOfDay();
        $graceMinutes = $this->getGraceMinutes();

        if ($this->relationLoaded('bookings')) {
            $bookings = $this->bookings
                ->whereIn('status', ['confirmed', 'active'])
                ->where('end_date', '>=', $today)
                ->where('start_date', '<=', $end);
        } else {
            $bookings = $this->bookings()
                ->whereIn('status', ['confirmed', 'active'])
                ->where('end_date', '>=', $today)
                ->where('start_date', '<=', $end)
                ->get(['start_date', 'end_date', 'pickup_time', 'return_time']);
        }

        $result = [];

        foreach ($bookings as $booking) {
            $start = max($booking->start_date, $today);
            $stop = min($booking->end_date, $end);
            $cursor = $start->copy();
            $startStr = $booking->start_date->toDateString();
            $endStr = $booking->end_date->toDateString();

            while ($cursor->lte($stop)) {
                $dateStr = $cursor->toDateString();

                if ($dateStr === $startStr && $dateStr === $endStr) {
                    // Same-day booking
                    $entry = ['date' => $dateStr, 'status' => 'partial'];
                    if ($booking->pickup_time) {
                        $entry['available_before'] = substr($booking->pickup_time, 0, 5);
                    }
                    if ($booking->return_time) {
                        $entry['available_after'] = $this->addMinutesToTime(substr($booking->return_time, 0, 5), $graceMinutes);
                    }
                    $this->mergeBookedDate($result, $entry);
                } elseif ($dateStr === $startStr && $booking->pickup_time) {
                    // Start date — available before pickup_time
                    $this->mergeBookedDate($result, [
                        'date' => $dateStr,
                        'status' => 'partial',
                        'available_before' => substr($booking->pickup_time, 0, 5),
                    ]);
                } elseif ($dateStr === $endStr && $booking->return_time) {
                    // End date — available after return_time + grace period
                    $this->mergeBookedDate($result, [
                        'date' => $dateStr,
                        'status' => 'partial',
                        'available_after' => $this->addMinutesToTime(substr($booking->return_time, 0, 5), $graceMinutes),
                    ]);
                } else {
                    // Fully booked
                    $this->mergeBookedDate($result, [
                        'date' => $dateStr,
                        'status' => 'full',
                    ]);
                }

                $cursor->addDay();
            }
        }

        return array_values($result);
    }

    private function addMinutesToTime(string $time, int $minutes): string
    {
        $parts = explode(':', $time);
        $h = (int) ($parts[0] ?? 0);
        $m = (int) ($parts[1] ?? 0);
        $total = $h * 60 + $m + $minutes;

        // When the grace period rolls into the next day the car is not free
        // again within this day — clamp to end-of-day instead of producing a
        // time earlier than the return (which would falsely mark it available).
        if ($total >= 24 * 60) {
            return '23:59';
        }

        return sprintf('%02d:%02d', intdiv($total, 60), $total % 60);
    }

    private function mergeBookedDate(array &$result, array $entry): void
    {
        $dateStr = $entry['date'];
        if (! isset($result[$dateStr])) {
            $result[$dateStr] = $entry;

            return;
        }

        $existing = $result[$dateStr];

        // If either is full, result is full
        if ($existing['status'] === 'full' || $entry['status'] === 'full') {
            $result[$dateStr] = ['date' => $dateStr, 'status' => 'full'];

            return;
        }

        // Both partial — merge time windows
        $merged = ['date' => $dateStr, 'status' => 'partial'];

        if (isset($existing['available_before']) || isset($entry['available_before'])) {
            $merged['available_before'] = $this->minTime(
                $existing['available_before'] ?? null,
                $entry['available_before'] ?? null
            );
        }
        if (isset($existing['available_after']) || isset($entry['available_after'])) {
            $merged['available_after'] = $this->maxTime(
                $existing['available_after'] ?? null,
                $entry['available_after'] ?? null
            );
        }

        $result[$dateStr] = $merged;
    }

    private function minTime(?string $a, ?string $b): ?string
    {
        if ($a === null) {
            return $b;
        }
        if ($b === null) {
            return $a;
        }

        return $a <= $b ? $a : $b;
    }

    private function maxTime(?string $a, ?string $b): ?string
    {
        if ($a === null) {
            return $b;
        }
        if ($b === null) {
            return $a;
        }

        return $a >= $b ? $a : $b;
    }
}
