<?php

namespace Database\Factories;

use App\Models\CouponType;
use Illuminate\Database\Eloquent\Factories\Factory;

class CouponTypeFactory extends Factory
{
    protected $model = CouponType::class;

    public function definition(): array
    {
        return [
            'name' => fake()->word(),
        ];
    }
}
