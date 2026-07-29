<?php

namespace Tests\Unit;

use App\Models\Car;
use App\Models\Tax;
use App\Models\TaxCategory;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use App\Services\TaxCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxCalculationServiceTest extends TestCase
{
    use RefreshDatabase;

    private TaxCalculationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(TaxCalculationService::class);
    }

    public function test_returns_empty_when_no_taxes_exist(): void
    {
        $result = $this->service->calculate('CLASS1', null, 3, 100, 300);

        $this->assertEmpty($result['taxes']);
        $this->assertEquals(0, $result['total_tax']);
        $this->assertEquals(0, $result['total_surcharge']);
        $this->assertEquals(0, $result['total_discount']);
    }

    public function test_calculates_percentage_per_rental_tax(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $class = VehicleClass::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, null, 3, 100, 300);

        $this->assertCount(1, $result['taxes']);
        $this->assertEquals(30, $result['total_tax']);
        $this->assertEquals(30, $result['taxes'][0]['amount']);
    }

    public function test_calculates_amount_per_day_tax(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $class = VehicleClass::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Day',
            'value_in' => 'Amount',
            'rate' => 5,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, null, 3, 100, 300);

        $this->assertCount(1, $result['taxes']);
        $this->assertEquals(15, $result['total_tax']);
        $this->assertEquals(15, $result['taxes'][0]['amount']);
    }

    public function test_skips_inactive_taxes(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $class = VehicleClass::factory()->create();
        Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => false,
        ]);
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 5,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, null, 3, 100, 300);

        $this->assertCount(1, $result['taxes']);
        $this->assertEquals(15, $result['total_tax']);
    }

    public function test_skips_taxes_not_matching_vehicle_class(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $classA = VehicleClass::factory()->create();
        $classB = VehicleClass::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($classA->class_no);

        $result = $this->service->calculate($classB->class_no, null, 3, 100, 300);

        $this->assertEmpty($result['taxes']);
    }

    public function test_categorizes_surcharge_separately(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Surcharge']);
        $class = VehicleClass::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Amount',
            'rate' => 20,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, null, 3, 100, 300);

        $this->assertEquals(20, $result['total_tax']);
        $this->assertEquals(20, $result['total_surcharge']);
    }

    public function test_handles_discount_taxes(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Discount']);
        $class = VehicleClass::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 5,
            'add_or_minus' => false,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, null, 3, 100, 300);

        $this->assertEquals(0, $result['total_tax']);
        $this->assertEquals(15, $result['total_discount']);
    }

    public function test_filters_by_location(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $class = VehicleClass::factory()->create();
        $location = VehicleLocation::factory()->create();
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Amount',
            'rate' => 10,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
            'location_id' => $location->location_id,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculate($class->class_no, $location->location_id, 3, 100, 300);
        $this->assertCount(1, $result['taxes']);

        $result2 = $this->service->calculate($class->class_no, 99999, 3, 100, 300);
        $this->assertEmpty($result2['taxes']);
    }

    public function test_calculate_for_car(): void
    {
        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $class = VehicleClass::factory()->create();
        $car = Car::factory()->create(['class_id' => $class->class_no]);
        $tax = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Rental',
            'value_in' => 'Percentage',
            'rate' => 10,
            'add_or_minus' => true,
            'apply_always' => true,
            'is_active' => true,
        ]);
        $tax->vehicleClasses()->attach($class->class_no);

        $result = $this->service->calculateForCar($car->id, null, 3, 100, 300);

        $this->assertEquals(30, $result['total_tax']);
    }
}
