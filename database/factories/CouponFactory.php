<?php

namespace Database\Factories;

use App\Models\Coupon;
use App\Models\CouponType;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponFactory extends Factory
{
    protected $model = Coupon::class;

    public function definition(): array
    {
        return [
            'coupon_type_id' => CouponType::factory(),
            'is_active' => true,
            'user_count' => 0,
        ];
    }
}
