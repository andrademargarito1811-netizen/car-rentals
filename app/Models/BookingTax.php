<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingTax extends Model
{
    protected $fillable = [
        'booking_id', 'tax_id', 'tax_desc', 'amount', 'add_or_minus',
    ];

    protected function casts(): array
    {
        return [
            'add_or_minus' => 'boolean',
            'amount' => 'decimal:2',
        ];
    }

    public function booking(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function tax(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tax::class);
    }
}
