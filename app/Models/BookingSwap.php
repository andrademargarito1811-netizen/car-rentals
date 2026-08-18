<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingSwap extends Model
{
    protected $fillable = [
        'booking_id', 'from_car_id', 'to_car_id', 'swap_date', 'swap_time',
        'swap_out_handover_id', 'swap_in_handover_id',
        'from_days', 'to_days', 'from_subtotal', 'to_subtotal',
        'old_total_amount', 'new_total_amount', 'price_delta', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'swap_date' => 'date:Y-m-d',
            'swap_time' => 'string',
            'from_subtotal' => 'decimal:2',
            'to_subtotal' => 'decimal:2',
            'old_total_amount' => 'decimal:2',
            'new_total_amount' => 'decimal:2',
            'price_delta' => 'decimal:2',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function fromCar(): BelongsTo
    {
        return $this->belongsTo(Car::class, 'from_car_id');
    }

    public function toCar(): BelongsTo
    {
        return $this->belongsTo(Car::class, 'to_car_id');
    }

    public function swapOutHandover(): BelongsTo
    {
        return $this->belongsTo(VehicleHandover::class, 'swap_out_handover_id');
    }

    public function swapInHandover(): BelongsTo
    {
        return $this->belongsTo(VehicleHandover::class, 'swap_in_handover_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
