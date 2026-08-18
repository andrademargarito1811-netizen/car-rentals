<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleHandover extends Model
{
    protected $fillable = [
        'booking_id', 'car_id', 'type', 'fuel_level', 'odometer', 'notes', 'damages', 'captured_by', 'captured_at', 'returned_at',
    ];

    protected function casts(): array
    {
        return [
            'fuel_level' => 'integer',
            'odometer' => 'decimal:2',
            'damages' => 'array',
            'captured_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function booking(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function car(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function capturedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'captured_by');
    }

    public function isPickup(): bool
    {
        return $this->type === 'pickup';
    }

    public function isReturn(): bool
    {
        return $this->type === 'return';
    }

    /**
     * Marks already present before the rental segment (carried from a pickup
     * baseline or prior record). These are reference/evidence, not liability.
     *
     * @return array<int, array<string, mixed>>
     */
    public function preExistingDamageMarks(): array
    {
        return array_values(array_filter(
            $this->damages ?? [],
            fn ($damage) => is_array($damage) && ! empty($damage['preexisting']),
        ));
    }

    /**
     * Marks newly-found at this inspection. Only these are eligible for damage
     * charges — pre-existing marks are excluded.
     *
     * @return array<int, array<string, mixed>>
     */
    public function newDamageMarks(): array
    {
        return array_values(array_filter(
            $this->damages ?? [],
            fn ($damage) => is_array($damage) && empty($damage['preexisting']),
        ));
    }
}
