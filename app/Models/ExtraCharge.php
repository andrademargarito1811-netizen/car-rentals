<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExtraCharge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'type', 'calculation', 'value_in',
        'operator', 'rate', 'taxable', 'apply_always', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'taxable' => 'boolean',
            'apply_always' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function bookingCharges(): HasMany
    {
        return $this->hasMany(BookingExtraCharge::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
