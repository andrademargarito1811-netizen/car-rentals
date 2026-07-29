<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use App\Services\BookingCreationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BookingCreationTest extends TestCase
{
    use RefreshDatabase;

    private BookingCreationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(BookingCreationService::class);
    }

    public function test_creates_booking_with_minimal_data(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD/CAST is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
            'daily_rate' => 100,
        ]);

        $booking = $this->service->create([
            'car_id' => $car->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'pickup_date' => now()->addDays(10)->format('Y-m-d'),
            'return_date' => now()->addDays(13)->format('Y-m-d'),
            'pickup_time' => '10:00',
            'return_time' => '14:00',
        ]);

        $this->assertInstanceOf(Booking::class, $booking);
        $this->assertEquals('pending', $booking->status);
        $this->assertEquals($car->id, $booking->car_id);
        $this->assertNotNull($booking->reference_code);
        $this->assertNotNull($booking->guest_id);
        $this->assertGreaterThan(0, $booking->total_amount);
    }

    public function test_creates_booking_with_coupon_and_tax(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD/CAST is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
            'daily_rate' => 100,
        ]);

        $booking = $this->service->create([
            'car_id' => $car->id,
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'pickup_date' => now()->addDays(5)->format('Y-m-d'),
            'return_date' => now()->addDays(7)->format('Y-m-d'),
            'pickup_time' => '09:00',
            'return_time' => '17:00',
            'coupon_code' => 'SAVE10',
            'discount' => 20,
            'tax_breakdown' => [
                ['tax_desc' => 'Sales Tax', 'amount' => 15, 'add_or_minus' => true],
            ],
            'total_tax' => 15,
            'total_surcharge' => 0,
        ]);

        $this->assertInstanceOf(Booking::class, $booking);
        $this->assertTrue($booking->total_amount > 0);
        $this->assertDatabaseHas('coupon_usages', ['booking_id' => $booking->id]);
        $this->assertDatabaseHas('booking_taxes', ['booking_id' => $booking->id]);
    }

    public function test_creates_booking_with_pickup_location(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD/CAST is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create(['location' => 'Downtown Office']);
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $booking = $this->service->create([
            'car_id' => $car->id,
            'first_name' => 'Bob',
            'last_name' => 'Jones',
            'email' => 'bob@example.com',
            'pickup_date' => now()->addDays(3)->format('Y-m-d'),
            'return_date' => now()->addDays(5)->format('Y-m-d'),
            'pickup_location' => 'Downtown Office',
        ]);

        $this->assertNotNull($booking->pickup_location_id);
        $this->assertEquals($location->location_id, $booking->pickup_location_id);
    }

    public function test_rejects_overlap(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD/CAST is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create(['grace_minutes' => 30]);
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $startDate = now()->addDays(20)->format('Y-m-d');
        $endDate = now()->addDays(22)->format('Y-m-d');

        $this->service->create([
            'car_id' => $car->id,
            'first_name' => 'First',
            'last_name' => 'Guest',
            'email' => 'first@example.com',
            'pickup_date' => $startDate,
            'return_date' => $endDate,
            'pickup_time' => '10:00',
            'return_time' => '12:00',
        ]);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        $this->expectExceptionMessage('overlap');

        $this->service->create([
            'car_id' => $car->id,
            'first_name' => 'Second',
            'last_name' => 'Guest',
            'email' => 'second@example.com',
            'pickup_date' => $startDate,
            'return_date' => $endDate,
            'pickup_time' => '10:00',
            'return_time' => '12:00',
        ]);
    }

    public function test_http_store_guest_endpoint(): void
    {
        if (DB::getDriverName() !== 'sqlsrv') {
            $this->markTestSkipped('DATEADD/CAST is SQL Server-specific');
        }

        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
            'daily_rate' => 80,
        ]);

        $payload = [
            'car_id' => $car->id,
            'first_name' => 'HTTP',
            'last_name' => 'Test',
            'email' => 'http@example.com',
            'email_confirmation' => 'http@example.com',
            'agree_terms' => true,
            'pickup_date' => now()->addDays(15)->format('Y-m-d'),
            'pickup_time' => '10:00',
            'return_date' => now()->addDays(17)->format('Y-m-d'),
            'return_time' => '14:00',
        ];

        $response = $this->postJson(route('reservations.store'), $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['booking_id', 'reference_code', 'total_amount']);
    }

    public function test_http_store_guest_validates_required_fields(): void
    {
        $response = $this->postJson(route('reservations.store'), []);

        $response->assertStatus(422);
    }
}
