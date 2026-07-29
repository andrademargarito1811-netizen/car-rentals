<?php

namespace Database\Factories;

use App\Models\Car;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

class CarFactory extends Factory
{
    protected $model = Car::class;

    public function definition(): array
    {
        return [
            'brand' => fake()->randomElement(['Toyota', 'Honda', 'Nissan', 'BMW', 'Mercedes']),
            'model' => fake()->word(),
            'year' => fake()->year(),
            'daily_rate' => fake()->randomFloat(2, 30, 200),
            'transmission' => fake()->randomElement(['automatic', 'manual']),
            'fuel_type' => fake()->randomElement(['gasoline', 'diesel', 'electric']),
            'seats' => fake()->numberBetween(2, 8),
            'air_conditioned' => true,
            'location_id' => VehicleLocation::factory(),
            'class_id' => VehicleClass::factory(),
            'availability_id' => VehicleAvailability::factory(),
        ];
    }
}
