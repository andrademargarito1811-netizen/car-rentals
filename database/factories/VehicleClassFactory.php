<?php

namespace Database\Factories;

use App\Models\VehicleClass;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleClassFactory extends Factory
{
    protected $model = VehicleClass::class;

    public function definition(): array
    {
        return [
            'class_no' => (string) fake()->unique()->randomNumber(4),
            'class_desc' => fake()->word(),
            'grace_minutes' => 30,
            'is_active' => true,
        ];
    }
}
