<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleHandover extends Model
{
    protected $fillable = [
        'booking_id', 'type', 'fuel_level', 'odometer', 'notes', 'damages', 'captured_by', 'captured_at',
    ];

    protected function casts(): array
    {
        return [
            'fuel_level' => 'integer',
            'odometer' => 'decimal:2',
            'damages' => 'array',
            'captured_at' => 'datetime',
        ];
    }

    public function booking(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Booking::class);
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
}
