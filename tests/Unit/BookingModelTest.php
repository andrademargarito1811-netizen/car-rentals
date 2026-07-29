<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_reference_code_on_create(): void
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

        $booking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
        ]);

        $this->assertNotNull($booking->reference_code);
        $this->assertStringStartsWith(now()->format('Y'), $booking->reference_code);
    }

    public function test_active_scope(): void
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

        Booking::factory()->create(['car_id' => $car->id, 'guest_id' => $guest->guest_id, 'status' => 'confirmed']);
        Booking::factory()->create(['car_id' => $car->id, 'guest_id' => $guest->guest_id, 'status' => 'active']);
        Booking::factory()->create(['car_id' => $car->id, 'guest_id' => $guest->guest_id, 'status' => 'cancelled']);

        $this->assertEquals(2, Booking::active()->count());
    }

    public function test_total_paid(): void
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

        $booking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'total_amount' => 500,
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'downpayment',
            'amount' => 200,
            'payment_method' => 'credit_card',
            'payment_status' => 'completed',
        ]);

        $this->assertEquals(200, $booking->totalPaid());
        $this->assertEquals(300, $booking->remainingBalance());
        $this->assertFalse($booking->isFullyPaid());
    }

    public function test_is_fully_paid(): void
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

        $booking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'total_amount' => 500,
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500,
            'payment_method' => 'credit_card',
            'payment_status' => 'completed',
        ]);

        $this->assertTrue($booking->fresh()->isFullyPaid());
        $this->assertEquals(0, $booking->fresh()->remainingBalance());
    }
}
