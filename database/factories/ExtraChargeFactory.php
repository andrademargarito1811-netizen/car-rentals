<?php

namespace Database\Factories;

use App\Models\ExtraCharge;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExtraChargeFactory extends Factory
{
    protected $model = ExtraCharge::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->word(),
            'type' => 'Extra Charge',
            'calculation' => 'Fixed',
            'value_in' => 'Amount',
            'operator' => '+',
            'rate' => fake()->randomFloat(2, 10, 200),
            'taxable' => false,
            'apply_always' => false,
            'is_active' => true,
        ];
    }
}
