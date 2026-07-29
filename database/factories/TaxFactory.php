<?php

namespace Database\Factories;

use App\Models\Tax;
use App\Models\TaxCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class TaxFactory extends Factory
{
    protected $model = Tax::class;

    public function definition(): array
    {
        return [
            'tax_desc' => fake()->sentence(3),
            'calculation' => 'Per Rental',
            'category_id' => TaxCategory::factory(),
            'value_in' => 'Amount',
            'add_or_minus' => true,
            'rate' => fake()->randomFloat(2, 1, 50),
            'apply_always' => true,
            'is_active' => true,
        ];
    }
}
