<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\ExtraCharge;
use App\Models\Tax;
use App\Models\TaxCategory;
use App\Models\VehicleHandover;
use App\Services\ExtraChargeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExtraChargeServiceTest extends TestCase
{
    use RefreshDatabase;

    private ExtraChargeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ExtraChargeService::class);
    }

    private function makeBooking(int $days = 1, float $dailyRate = 100.0): Booking
    {
        $car = Car::factory()->create(['daily_rate' => $dailyRate]);

        return Booking::factory()->create([
            'car_id' => $car->id,
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addDays($days - 1)->format('Y-m-d'),
            'total_amount' => $dailyRate * $days,
            'status' => 'active',
        ]);
    }

    private function makeReturnHandover(Booking $booking): VehicleHandover
    {
        return VehicleHandover::create([
            'booking_id' => $booking->id,
            'type' => 'return',
            'fuel_level' => 8,
            'odometer' => 1000,
        ]);
    }

    public function test_computes_fixed_amount_charge(): void
    {
        $booking = $this->makeBooking();
        $charge = ExtraCharge::factory()->create([
            'calculation' => 'Fixed',
            'value_in' => 'Amount',
            'rate' => 50,
        ]);

        $computed = $this->service->computeAmount($charge, $booking);

        $this->assertEquals(50, $computed['amount']);
        $this->assertEquals(0, $computed['tax']);
        $this->assertEquals(50, $computed['total']);
    }

    public function test_computes_per_day_amount_charge(): void
    {
        $booking = $this->makeBooking(3);
        $charge = ExtraCharge::factory()->create([
            'calculation' => 'Per Day',
            'value_in' => 'Amount',
            'rate' => 10,
        ]);

        $computed = $this->service->computeAmount($charge, $booking);

        $this->assertEquals(30, $computed['amount']);
    }

    public function test_computes_percentage_fixed_charge(): void
    {
        $booking = $this->makeBooking(3, 100);
        $charge = ExtraCharge::factory()->create([
            'calculation' => 'Fixed',
            'value_in' => 'Percentage',
            'rate' => 10,
        ]);

        $computed = $this->service->computeAmount($charge, $booking);

        $this->assertEquals(30, $computed['amount']);
    }

    public function test_computes_tax_on_taxable_charge(): void
    {
        $booking = $this->makeBooking();
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
        ]);
        BookingTax::create([
            'booking_id' => $booking->id,
            'tax_id' => $tax->id,
            'tax_desc' => 'VAT',
            'amount' => 10,
            'add_or_minus' => true,
        ]);

        $charge = ExtraCharge::factory()->create([
            'calculation' => 'Fixed',
            'value_in' => 'Amount',
            'rate' => 100,
            'taxable' => true,
        ]);

        $computed = $this->service->computeAmount($charge, $booking);

        $this->assertEquals(100, $computed['amount']);
        $this->assertEquals(10, $computed['tax']);
        $this->assertEquals(110, $computed['total']);
    }

    public function test_ignores_per_day_and_amount_taxes_for_charge_tax(): void
    {
        $booking = $this->makeBooking();
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $perDay = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Day',
            'value_in' => 'Percentage',
            'rate' => 5,
            'add_or_minus' => true,
        ]);
        $flat = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Amount',
            'rate' => 5,
            'add_or_minus' => true,
        ]);
        BookingTax::create(['booking_id' => $booking->id, 'tax_id' => $perDay->id, 'tax_desc' => 'Per Day', 'amount' => 5, 'add_or_minus' => true]);
        BookingTax::create(['booking_id' => $booking->id, 'tax_id' => $flat->id, 'tax_desc' => 'Flat', 'amount' => 5, 'add_or_minus' => true]);

        $charge = ExtraCharge::factory()->create(['taxable' => true, 'rate' => 100]);

        $computed = $this->service->computeAmount($charge, $booking);

        $this->assertEquals(0, $computed['tax']);
    }

    public function test_apply_for_return_persists_charges_and_returns_total(): void
    {
        $booking = $this->makeBooking();
        $handover = $this->makeReturnHandover($booking);
        $charge = ExtraCharge::factory()->create([
            'name' => 'CDW',
            'calculation' => 'Fixed',
            'value_in' => 'Amount',
            'rate' => 50,
            'operator' => '+',
        ]);

        $result = $this->service->applyForReturn($booking, [$charge->id], $handover);

        $this->assertCount(1, $result['charges']);
        $this->assertEquals(50, $result['total']);

        $this->assertDatabaseHas('booking_extra_charges', [
            'booking_id' => $booking->id,
            'handover_id' => $handover->id,
            'extra_charge_id' => $charge->id,
            'name' => 'CDW',
            'amount' => 50,
            'operator' => '+',
            'source' => 'return',
        ]);
    }

    public function test_discount_operator_reduces_total(): void
    {
        $booking = $this->makeBooking();
        $handover = $this->makeReturnHandover($booking);
        $charge = ExtraCharge::factory()->create([
            'type' => 'Discount',
            'operator' => '-',
            'rate' => 25,
        ]);

        $result = $this->service->applyForReturn($booking, [$charge->id], $handover);

        $this->assertEquals(-25, $result['total']);
    }

    public function test_skips_inactive_and_unknown_charges(): void
    {
        $booking = $this->makeBooking();
        $handover = $this->makeReturnHandover($booking);
        $inactive = ExtraCharge::factory()->create(['is_active' => false]);

        $result = $this->service->applyForReturn($booking, [$inactive->id, 99999], $handover);

        $this->assertEmpty($result['charges']);
        $this->assertEquals(0, $result['total']);
    }

    public function test_preview_total_matches_apply_total(): void
    {
        $booking = $this->makeBooking(2);
        $charge = ExtraCharge::factory()->create([
            'calculation' => 'Per Day',
            'value_in' => 'Amount',
            'rate' => 15,
            'taxable' => true,
        ]);

        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
        ]);
        BookingTax::create(['booking_id' => $booking->id, 'tax_id' => $tax->id, 'tax_desc' => 'VAT', 'amount' => 20, 'add_or_minus' => true]);

        $preview = $this->service->previewTotal($booking, [$charge->id]);

        $handover = $this->makeReturnHandover($booking);
        $applied = $this->service->applyForReturn($booking, [$charge->id], $handover);

        $this->assertEquals($applied['total'], $preview);
        $this->assertEquals(33, $preview);
    }
}
