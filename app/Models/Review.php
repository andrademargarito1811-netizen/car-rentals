<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'booking_id', 'car_id', 'user_id', 'guest_id',
        'rating', 'comment', 'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_approved' => 'boolean',
        ];
    }

    public function scopeApproved($query)
    {
        return $query->where('is_approved', true);
    }

    public function scopePending($query)
    {
        return $query->where('is_approved', false);
    }

    public function getCustomerNameAttribute(): string
    {
        $name = $this->user?->name
            ?? trim(($this->guest?->first_name ?? '').' '.($this->guest?->last_name ?? ''));

        return $name !== '' ? $name : 'Anonymous';
    }

    public function getCustomerEmailAttribute(): ?string
    {
        return $this->user?->email ?? $this->guest?->email;
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function car()
    {
        return $this->belongsTo(Car::class, 'car_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function guest()
    {
        return $this->belongsTo(Guest::class, 'guest_id', 'guest_id');
    }
}
