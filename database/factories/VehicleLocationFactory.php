<?php

namespace Database\Factories;

use App\Models\VehicleLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleLocationFactory extends Factory
{
    protected $model = VehicleLocation::class;

    public function definition(): array
    {
        return [
            'location' => fake()->city(),
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
