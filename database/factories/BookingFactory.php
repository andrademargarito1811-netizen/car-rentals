<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    protected $model = Booking::class;

    public function definition(): array
    {
        $start = fake()->dateTimeBetween('now', '+30 days');
        $end = (clone $start)->modify('+' . fake()->numberBetween(1, 7) . ' days');

        return [
            'car_id' => Car::factory(),
            'guest_id' => Guest::factory(),
            'start_date' => $start->format('Y-m-d'),
            'end_date' => $end->format('Y-m-d'),
            'total_amount' => fake()->randomFloat(2, 100, 2000),
            'status' => 'pending',
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => ['status' => 'confirmed']);
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => 'active']);
    }

    public function completed(): static
    {
        return $this->state(fn () => ['status' => 'completed']);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => 'cancelled']);
    }
}
