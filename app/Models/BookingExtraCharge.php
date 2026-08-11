<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingExtraCharge extends Model
{
    protected $fillable = [
        'booking_id', 'extra_charge_id', 'handover_id', 'name', 'rate',
        'value_in', 'calculation', 'operator', 'taxable',
        'amount', 'tax_amount', 'source',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'taxable' => 'boolean',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function extraCharge(): BelongsTo
    {
        return $this->belongsTo(ExtraCharge::class);
    }

    public function handover(): BelongsTo
    {
        return $this->belongsTo(VehicleHandover::class);
    }

    public function isAdd(): bool
    {
        return $this->operator === '+';
    }
}
