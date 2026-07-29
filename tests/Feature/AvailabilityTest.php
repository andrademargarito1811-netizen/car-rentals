<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_car_available_between_with_no_bookings(): void
    {
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $this->assertTrue($car->isAvailable());
        $this->assertEmpty($car->bookedDates(30));
    }

    public function test_booked_dates_returns_correctly(): void
    {
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $guest = Guest::factory()->create();
        Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->addDays(5)->format('Y-m-d'),
            'end_date' => now()->addDays(7)->format('Y-m-d'),
            'status' => 'confirmed',
        ]);

        $bookedDates = $car->bookedDates(30);
        $this->assertNotEmpty($bookedDates);

        $dateStrings = array_column($bookedDates, 'date');
        $start = now()->addDays(5)->format('Y-m-d');
        $end = now()->addDays(7)->format('Y-m-d');

        $this->assertContains($start, $dateStrings);
        $this->assertContains($end, $dateStrings);
    }

    public function test_check_availability_endpoint(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $response = $this->postJson(route('cars.check-availability'), [
            'car_id' => $car->id,
            'pickup_date' => now()->addDays(30)->format('Y-m-d'),
            'return_date' => now()->addDays(33)->format('Y-m-d'),
        ]);

        $response->assertJson(['available' => true]);
    }

    public function test_available_scope_only_returns_available_cars(): void
    {
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availAvailable = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $availUnavailable = VehicleAvailability::factory()->create(['available_desc' => 'unavailable']);

        Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availAvailable->available_id,
        ]);
        Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availUnavailable->available_id,
        ]);

        $this->assertEquals(1, Car::available()->count());
    }
}
