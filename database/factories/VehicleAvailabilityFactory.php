<?php

namespace Database\Factories;

use App\Models\VehicleAvailability;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleAvailabilityFactory extends Factory
{
    protected $model = VehicleAvailability::class;

    public function definition(): array
    {
        return [
            'available_desc' => 'available',
            'is_active' => true,
        ];
    }
}
