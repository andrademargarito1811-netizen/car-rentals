<?php

namespace Tests\Feature;

use App\Exceptions\BookingSwapException;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingSwap;
use App\Models\Car;
use App\Models\Guest;
use App\Models\Tax;
use App\Models\TaxCategory;
use App\Models\User;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleHandover;
use App\Models\VehicleLocation;
use App\Services\BookingSwapService;
use App\Services\HandoverChargeCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingSwapTest extends TestCase
{
    use RefreshDatabase;

    private BookingSwapService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(BookingSwapService::class);
    }

    private function makeCar(array $overrides = []): Car
    {
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create(['grace_minutes' => 30]);
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);

        return Car::factory()->create(array_merge([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
            'daily_rate' => 100,
        ], $overrides));
    }

    private function makeBooking(Car $car, string $start, string $end, string $status = 'confirmed', float $total = 0): Booking
    {
        $guest = Guest::factory()->create();

        return Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => $start,
            'end_date' => $end,
            'pickup_time' => '10:00',
            'return_time' => '10:00',
            'total_amount' => $total,
            'status' => $status,
        ]);
    }

    private function makeTax(float $rate, string $calculation = 'Per Day', string $valueIn = 'Amount', bool $add = true): Tax
    {
        $category = TaxCategory::factory()->create(['name' => $add ? 'Tax' : 'Discount']);
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => $calculation,
            'value_in' => $valueIn,
            'rate' => $rate,
            'add_or_minus' => $add,
        ]);

        return $tax;
    }

    public function test_swap_switches_car_keeps_dates_and_recomputes_total(): void
    {
        $car1 = $this->makeCar(['daily_rate' => 100]);
        $car2 = $this->makeCar(['daily_rate' => 80]);
        $this->makeTax(5, 'Per Day', 'Amount', true)->vehicleClasses()->attach([$car1->vehicleClass->class_no, $car2->vehicleClass->class_no]);

        // 6-day booking (08-14 → 08-20) at $100/day = $600 + $30 tax = $630.
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 630.0);

        $quote = $this->service->quote($booking, $car2->id, '2026-08-15', '10:00');

        // Option 4 (rate-differential): base = old rate × window (6 days), delta = rate diff × remaining (5 days).
        $this->assertEquals(6, $quote['from_days']);
        $this->assertEquals(5, $quote['to_days']);
        $this->assertEquals(600.0, $quote['from_subtotal']);
        $this->assertEquals(-100.0, $quote['to_subtotal']);
        // 6 × $100 base + (−$20 × 5) delta + $55 tax = $555.
        $this->assertEquals(555.0, $quote['new_total_amount']);
        $this->assertEquals(-75.0, $quote['price_delta']);

        $fresh = $this->service->swap($booking, $car2->id, '2026-08-15', '10:00');

        $this->assertEquals($car2->id, $fresh->car_id);
        $this->assertEquals('2026-08-14', $fresh->start_date->format('Y-m-d'));
        $this->assertEquals('2026-08-20', $fresh->end_date->format('Y-m-d'));
        $this->assertEquals(555.0, (float) $fresh->total_amount);
        $this->assertDatabaseHas('booking_swaps', [
            'booking_id' => $fresh->id,
            'from_car_id' => $car1->id,
            'to_car_id' => $car2->id,
            'price_delta' => -75.0,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'booking_swapped',
            'model_type' => Booking::class,
            'model_id' => $fresh->id,
        ]);
    }

    public function test_multiple_swaps_accumulate_segments(): void
    {
        $car1 = $this->makeCar(['daily_rate' => 100]);
        $car2 = $this->makeCar(['daily_rate' => 80]);
        $car3 = $this->makeCar(['daily_rate' => 120]);
        $this->makeTax(5, 'Per Day', 'Amount', true)->vehicleClasses()->attach([$car1->vehicleClass->class_no, $car2->vehicleClass->class_no, $car3->vehicleClass->class_no]);

        // 08-14 → 08-20, 6 days. Initial total 630.
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 630.0);

        // Swap #1 on 08-15 → car2: base 6×$100 = $600, delta (−$20)×5 = −$100, tax $55 = $555.
        $this->service->swap($booking, $car2->id, '2026-08-15', '10:00');
        $this->assertEquals(1, $booking->fresh()->swaps()->count());

        // Swap #2 on 08-17 → car3: base 6×$80 = $480, delta ($40)×3 = $120, tax $45 = $645.
        $quote = $this->service->quote($booking->fresh(), $car3->id, '2026-08-17', '10:00');
        $this->assertEquals(6, $quote['from_days']);
        $this->assertEquals(3, $quote['to_days']);
        $this->assertEquals(480.0, $quote['from_subtotal']);
        $this->assertEquals(120.0, $quote['to_subtotal']);
        $this->assertEquals(645.0, $quote['new_total_amount']);

        $fresh = $this->service->swap($booking->fresh(), $car3->id, '2026-08-17', '10:00');

        $this->assertEquals($car3->id, $fresh->car_id);
        $this->assertEquals(645.0, (float) $fresh->total_amount);
        $this->assertCount(2, $fresh->swaps()->get());

        $segments = $fresh->swapSegments();
        $this->assertCount(2, $segments);
        $this->assertEquals($car2->id, $segments[0]['car']['id']);
        $this->assertEquals(480.0, $segments[0]['subtotal']);
        $this->assertEquals($car3->id, $segments[1]['car']['id']);
        $this->assertEquals(120.0, $segments[1]['subtotal']);
    }

    public function test_swap_rejects_same_car_and_occupied_new_car(): void
    {
        $car1 = $this->makeCar();
        $car2 = $this->makeCar();
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);

        try {
            $this->service->quote($booking, $car1->id, '2026-08-15', '10:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('already assigned', $e->getMessage());
        }

        // car2 already occupied for part of the swap window.
        $this->makeBooking($car2, '2026-08-16', '2026-08-18', 'confirmed', 300.0);

        try {
            $this->service->quote($booking, $car2->id, '2026-08-15', '10:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('already reserved', $e->getMessage());
        }
    }

    public function test_swap_rejects_invalid_dates_and_returned_booking(): void
    {
        $car1 = $this->makeCar();
        $car2 = $this->makeCar();
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);

        // Swap before pickup is not allowed.
        try {
            $this->service->quote($booking, $car2->id, '2026-08-13', '10:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('swap date', $e->getMessage());
        }

        // A same-day swap with less than the minimum usage (2h) is not allowed.
        try {
            $this->service->quote($booking, $car2->id, '2026-08-14', '11:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('2 hours after pickup', $e->getMessage());
        }

        // Swap after the return datetime is not allowed.
        try {
            $this->service->quote($booking, $car2->id, '2026-08-21', '10:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('swap date', $e->getMessage());
        }

        // Already returned bookings cannot be swapped.
        $returned = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);
        VehicleHandover::create([
            'booking_id' => $returned->id,
            'type' => 'return',
            'car_id' => $car1->id,
            'fuel_level' => 4,
            'odometer' => 1000,
        ]);

        try {
            $this->service->quote($returned, $car2->id, '2026-08-15', '10:00');
            $this->fail('Expected BookingSwapException was not thrown.');
        } catch (BookingSwapException $e) {
            $this->assertStringContainsString('already been returned', $e->getMessage());
        }
    }

    public function test_same_day_swap_after_minimum_usage_is_allowed(): void
    {
        $car1 = $this->makeCar(['daily_rate' => 100]);
        $car2 = $this->makeCar(['daily_rate' => 80]);
        $this->makeTax(5, 'Per Day', 'Amount', true)->vehicleClasses()->attach([$car1->vehicleClass->class_no, $car2->vehicleClass->class_no]);

        // 3-day booking (08-14 → 08-17) at $100/day = $300 + $15 tax = $315.
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-17', 'active', 315.0);

        // Same-day swap at 12:00 (2h after the 10:00 pickup) is allowed.
        $quote = $this->service->quote($booking, $car2->id, '2026-08-14', '12:00');

        // Option 4: base = 3 days × $100 = $300 (whole window), delta = −$20 × 3 remaining = −$60.
        $this->assertEquals(3, $quote['from_days']);
        $this->assertEquals(3, $quote['to_days']);
        $this->assertEquals(300.0, $quote['from_subtotal']);
        $this->assertEquals(-60.0, $quote['to_subtotal']);
        // $300 base − $60 delta + $30 tax = $270.
        $this->assertEquals(270.0, $quote['new_total_amount']);
    }

    public function test_guest_http_submit_swaps_vehicle(): void
    {
        $car1 = $this->makeCar(['daily_rate' => 100]);
        $car2 = $this->makeCar(['daily_rate' => 80]);
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);

        $response = $this->post(route('bookings.guest.swap.submit', $booking->reference_code), [
            'car_id' => $car2->id,
            'swap_date' => '2026-08-15',
            'swap_time' => '10:00',
        ]);

        $response->assertRedirect(route('bookings.guest.show', $booking->reference_code));

        $fresh = $booking->fresh();
        $this->assertEquals($car2->id, $fresh->car_id);
        $this->assertEquals(500.0, (float) $fresh->total_amount);
        $this->assertDatabaseHas('audit_logs', ['action' => 'booking_swapped']);
    }

    public function test_guest_http_quote_returns_422_on_conflict(): void
    {
        $car1 = $this->makeCar();
        $car2 = $this->makeCar();
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);
        $this->makeBooking($car2, '2026-08-16', '2026-08-18', 'confirmed', 300.0);

        $response = $this->postJson(route('bookings.guest.swap.quote', $booking->reference_code), [
            'car_id' => $car2->id,
            'swap_date' => '2026-08-15',
            'swap_time' => '10:00',
        ]);

        $response->assertStatus(422);
    }

    public function test_admin_http_submit_requires_swap_handovers(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $car1 = $this->makeCar();
        $car2 = $this->makeCar();
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);

        // Missing handover data → validation errors, no swap applied.
        $this->actingAs($admin)
            ->from(route('admin.bookings.swap.page', $booking->id))
            ->post(route('admin.bookings.swap.submit', $booking->id), [
                'car_id' => $car2->id,
                'swap_date' => '2026-08-15',
                'swap_time' => '10:00',
            ])
            ->assertSessionHasErrors(['swap_out_fuel', 'swap_out_odometer', 'swap_in_fuel', 'swap_in_odometer']);

        $this->assertSame($car1->id, $booking->fresh()->car_id);

        // Complete handover + no-damage acknowledgements → swap applied with
        // both handovers recorded.
        $this->actingAs($admin)
            ->from(route('admin.bookings.swap.page', $booking->id))
            ->post(route('admin.bookings.swap.submit', $booking->id), [
                'car_id' => $car2->id,
                'swap_date' => '2026-08-15',
                'swap_time' => '10:00',
                'swap_out_fuel' => 6,
                'swap_out_odometer' => 10500,
                'swap_out_no_damage' => '1',
                'swap_in_fuel' => 8,
                'swap_in_odometer' => 2000,
                'swap_in_no_damage' => '1',
            ])
            ->assertRedirect(route('admin.bookings.show', $booking->id));

        $fresh = $booking->fresh();
        $swap = $fresh->swaps()->first();
        $this->assertNotNull($swap->swap_out_handover_id);
        $this->assertNotNull($swap->swap_in_handover_id);

        $this->assertDatabaseHas('vehicle_handovers', [
            'booking_id' => $fresh->id,
            'car_id' => $car1->id,
            'type' => 'return',
            'fuel_level' => 6,
        ]);
        $this->assertDatabaseHas('vehicle_handovers', [
            'booking_id' => $fresh->id,
            'car_id' => $car2->id,
            'type' => 'pickup',
            'fuel_level' => 8,
        ]);
    }

    public function test_admin_swap_records_handovers_and_charges_each_car_segment(): void
    {
        $car1 = $this->makeCar([
            'daily_rate' => 100,
            'free_km_per_day' => 100,
            'additional_km_rate' => 0.50,
            'fuel_charges' => 45.00,
        ]);
        $car2 = $this->makeCar([
            'daily_rate' => 80,
            'free_km_per_day' => 100,
            'additional_km_rate' => 0.50,
            'fuel_charges' => 45.00,
        ]);
        $booking = $this->makeBooking($car1, '2026-08-14', '2026-08-20', 'active', 600.0);

        // Original pickup on the outgoing car.
        VehicleHandover::create([
            'booking_id' => $booking->id,
            'car_id' => $car1->id,
            'type' => 'pickup',
            'fuel_level' => 8,
            'odometer' => 1000,
        ]);

        $fresh = $this->service->swap($booking, $car2->id, '2026-08-16', '10:00', [
            'swap_out_fuel' => 5,
            'swap_out_odometer' => 1300,
            'swap_out_notes' => 'swapped out',
            'swap_out_damages' => [],
            'swap_in_fuel' => 7,
            'swap_in_odometer' => 20000,
            'swap_in_notes' => 'swapped in',
            'swap_in_damages' => [],
        ]);

        $swap = $fresh->swaps()->first();
        $this->assertNotNull($swap->swap_out_handover_id);
        $this->assertNotNull($swap->swap_in_handover_id);

        $swapOut = VehicleHandover::find($swap->swap_out_handover_id);
        $swapIn = VehicleHandover::find($swap->swap_in_handover_id);

        $this->assertEquals('return', $swapOut->type);
        $this->assertEquals($car1->id, $swapOut->car_id);
        $this->assertEquals(5, $swapOut->fuel_level);
        $this->assertEquals(1300, (float) $swapOut->odometer);

        $this->assertEquals('pickup', $swapIn->type);
        $this->assertEquals($car2->id, $swapIn->car_id);
        $this->assertEquals(7, $swapIn->fuel_level);
        $this->assertEquals(20000, (float) $swapIn->odometer);

        // Final return on the replacement car.
        $returnHandover = new VehicleHandover([
            'booking_id' => $fresh->id,
            'car_id' => $car2->id,
            'type' => 'return',
            'fuel_level' => 6,
            'odometer' => 20300,
        ]);

        $charges = app(HandoverChargeCalculator::class)->calculate($fresh, $returnHandover);

        // Car1 segment (08-14 → 08-16, 2 days): 300 km, 200 free → 100 excess × $0.50 = $50;
        // fuel 8→5 (3 bars) → $45 refuel.
        // Car2 segment (08-16 → 08-20, 4 days): 300 km, 400 free → no excess;
        // fuel 7→6 (1 bar) → no refuel.
        $this->assertEquals(45.00, $charges['fuel_refuel']);
        $this->assertEquals(50.00, $charges['excess_mileage']);
        $this->assertEquals(600.0, $charges['km_driven']);
        $this->assertEquals(95.00, $charges['total']);
    }
}
