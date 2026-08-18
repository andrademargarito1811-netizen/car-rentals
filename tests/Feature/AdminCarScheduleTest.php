<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\User;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCarScheduleTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_passes_car_query_param_as_initial_car(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.cars.schedule', ['car' => $car->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Cars/Schedule')
                ->where('initialCarId', $car->id));
    }

    public function test_schedule_without_car_param_defaults_to_null(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->get(route('admin.cars.schedule'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/Cars/Schedule')
                ->where('initialCarId', null));
    }
}
