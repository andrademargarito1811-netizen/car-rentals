<?php

namespace Tests\Feature;

use App\Models\Coupon;
use App\Models\CouponType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CouponValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_invalid_for_nonexistent_coupon(): void
    {
        $response = $this->postJson(route('coupons.validate'), ['code' => 'INVALID']);

        $response->assertJson(['valid' => false, 'message' => 'Coupon code not found.']);
    }

    public function test_returns_invalid_for_inactive_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Amount']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => false,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson(['valid' => false, 'message' => 'This coupon is no longer active.']);
    }

    public function test_returns_invalid_for_expired_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Amount']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'start_date' => now()->subDays(20)->format('Y-m-d'),
            'end_date' => now()->subDays(1)->format('Y-m-d'),
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson(['valid' => false]);
    }

    public function test_returns_invalid_when_max_uses_reached(): void
    {
        $type = CouponType::factory()->create(['name' => 'Amount']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'max_uses' => 10,
            'user_count' => 10,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson(['valid' => false, 'message' => 'This coupon has reached its usage limit.']);
    }

    public function test_returns_invalid_when_below_min_order(): void
    {
        $type = CouponType::factory()->create(['name' => 'Amount']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'min_order' => 500,
            'min_rate' => 50,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), [
            'code' => $coupon->code,
            'subtotal' => 100,
        ]);

        $response->assertJson(['valid' => false]);
    }

    public function test_returns_valid_for_amount_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Amount']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'min_rate' => 25,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson([
            'valid' => true,
            'coupon' => [
                'type' => 'fixed',
                'value' => 25,
            ],
        ]);
    }

    public function test_returns_valid_for_percentage_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Percentage']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'min_rate' => 10,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson([
            'valid' => true,
            'coupon' => [
                'type' => 'percent',
                'value' => 10,
                'label' => '10% off',
            ],
        ]);
    }

    public function test_returns_valid_for_per_day_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Per Day']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'min_rate' => 15,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson([
            'valid' => true,
            'coupon' => [
                'type' => 'per_day',
                'value' => 15,
                'label' => '$15.00 off per day',
            ],
        ]);
    }

    public function test_returns_valid_for_day_free_coupon(): void
    {
        $type = CouponType::factory()->create(['name' => 'Day Free']);
        Coupon::factory()->create([
            'coupon_type_id' => $type->id,
            'is_active' => true,
            'min_rate' => 1,
        ]);

        $coupon = Coupon::first();
        $response = $this->postJson(route('coupons.validate'), ['code' => $coupon->code]);

        $response->assertJson([
            'valid' => true,
            'coupon' => [
                'type' => 'day_free',
                'value' => 1,
                'label' => '1 day(s) free',
            ],
        ]);
    }
}
