<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'booking_id', 'type', 'amount', 'payment_method',
        'payment_status', 'transaction_id', 'card_last_four', 'metadata'
    ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    public function booking(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function isDownpayment(): bool
    {
        return $this->type === 'downpayment';
    }

    public function isRemaining(): bool
    {
        return $this->type === 'remaining';
    }

    public function isFullPayment(): bool
    {
        return $this->type === 'full_payment';
    }

    public function isCompleted(): bool
    {
        return $this->payment_status === 'completed';
    }

}
