<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\Car;
use App\Models\VehicleHandover;
use App\Services\HandoverChargeCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HandoverChargeCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private HandoverChargeCalculator $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(HandoverChargeCalculator::class);
    }

    private function makeBooking(int $days = 1): Booking
    {
        $car = Car::factory()->create([
            'free_km_per_day' => 100,
            'additional_km_rate' => 0.50,
            'fuel_charges' => 45.00,
        ]);

        $start = now()->format('Y-m-d');
        $end = now()->addDays($days - 1)->format('Y-m-d');

        return Booking::factory()->create([
            'car_id' => $car->id,
            'start_date' => $start,
            'end_date' => $end,
            'total_amount' => 100.00,
            'status' => 'active',
        ]);
    }

    private function makeHandover(Booking $booking, string $type, int $fuel, float $odometer): VehicleHandover
    {
        return VehicleHandover::create([
            'booking_id' => $booking->id,
            'car_id' => $booking->car_id,
            'type' => $type,
            'fuel_level' => $fuel,
            'odometer' => $odometer,
        ]);
    }

    public function test_no_charges_when_vehicle_returned_full_and_within_allowance(): void
    {
        $booking = $this->makeBooking(2);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 8, 1190);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(0, $charges['fuel_refuel']);
        $this->assertEquals(0, $charges['excess_mileage']);
        $this->assertEquals(0, $charges['total']);
    }

    public function test_charges_fuel_when_returned_below_tolerance(): void
    {
        $booking = $this->makeBooking(1);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 5, 1080);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(45.00, $charges['fuel_refuel']);
        $this->assertEquals(0, $charges['excess_mileage']);
        $this->assertEquals(45.00, $charges['total']);
    }

    public function test_no_fuel_charge_within_small_tolerance(): void
    {
        $booking = $this->makeBooking(1);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 8, 1080);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(0, $charges['fuel_refuel']);
    }

    public function test_no_fuel_charge_when_one_bar_dropped(): void
    {
        $booking = $this->makeBooking(1);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 7, 1080);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(0, $charges['fuel_refuel']);
    }

    public function test_charges_fuel_when_two_bars_dropped(): void
    {
        $booking = $this->makeBooking(1);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 6, 1080);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(45.00, $charges['fuel_refuel']);
    }

    public function test_charges_excess_mileage_beyond_daily_allowance(): void
    {
        $booking = $this->makeBooking(2);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 8, 1250);

        $charges = $this->service->calculate($booking);

        $freeKm = 100 * 2;
        $excessKm = 250 - $freeKm;
        $this->assertEquals($excessKm, $charges['excess_km']);
        $this->assertEquals(round($excessKm * 0.50, 2), $charges['excess_mileage']);
        $this->assertEquals($charges['excess_mileage'], $charges['total']);
    }

    public function test_no_mileage_charge_when_rate_not_configured(): void
    {
        $booking = $this->makeBooking(1);
        $booking->car()->update(['additional_km_rate' => null]);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 8, 1300);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(0, $charges['excess_mileage']);
        $this->assertEquals(0, $charges['total']);
    }

    public function test_no_fuel_charge_when_fuel_fee_not_configured(): void
    {
        $booking = $this->makeBooking(1);
        $booking->car()->update(['fuel_charges' => null]);
        $pickup = $this->makeHandover($booking, 'pickup', 8, 1000);
        $return = $this->makeHandover($booking, 'return', 5, 1080);

        $charges = $this->service->calculate($booking);

        $this->assertEquals(0, $charges['fuel_refuel']);
        $this->assertEquals(0, $charges['total']);
    }
}

