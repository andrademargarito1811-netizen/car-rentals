<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Coupon extends Model
{
    use HasFactory;
    protected $fillable = [
        'issued_by', 'start_date', 'end_date',
        'min_order', 'max_uses', 'user_count',
        'coupon_type_id', 'min_rate', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
            'min_order' => 'decimal:2',
            'min_rate' => 'decimal:2',
            'is_active' => 'boolean',
            'user_count' => 'integer',
            'max_uses' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Coupon $coupon) {
            $coupon->code = Str::upper(Str::random(16));
        });
    }

    public function couponType(): BelongsTo
    {
        return $this->belongsTo(CouponType::class);
    }
}
