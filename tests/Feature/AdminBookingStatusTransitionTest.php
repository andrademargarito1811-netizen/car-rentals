<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\User;
use App\Models\VehicleHandover;
use App\Services\ExtraChargeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Mockery\MockInterface;
use Tests\TestCase;

class AdminBookingStatusTransitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function test_confirming_a_pending_booking_records_downpayment_and_audit(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->booking('pending', 100);

        $this->actingAs($admin)
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'confirmed',
                'downpayment_amount' => 50,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'type' => 'downpayment',
            'amount' => 50,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'model_type' => Booking::class,
            'model_id' => (string) $booking->id,
            'action' => 'booking_status_updated',
        ]);
    }

    public function test_completing_an_active_booking_requires_a_pickup_handover(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->booking('active', 100);

        $this->actingAs($admin)
            ->from(route('admin.bookings.show', $booking->id))
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'completed',
                'return_fuel' => 7,
                'return_odometer' => 10100,
                'no_damage' => '1',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('status');

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'active']);
    }

    public function test_confirming_with_an_exhausted_coupon_rolls_back_the_transition(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->booking('pending', 100);

        $coupon = Coupon::factory()->create(['max_uses' => 1, 'user_count' => 1]);
        CouponUsage::create([
            'booking_id' => $booking->id,
            'coupon_id' => $coupon->id,
            'code' => $coupon->code,
            'discount_amount' => 10,
        ]);

        $this->actingAs($admin)
            ->from(route('admin.bookings.show', $booking->id))
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'confirmed',
                'downpayment_amount' => 50,
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('status');

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'pending']);
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseHas('coupons', ['id' => $coupon->id, 'user_count' => 1]);
    }

    public function test_confirming_increments_coupon_usage_counter(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->booking('pending', 100);

        $coupon = Coupon::factory()->create(['max_uses' => 5, 'user_count' => 2]);
        CouponUsage::create([
            'booking_id' => $booking->id,
            'coupon_id' => $coupon->id,
            'code' => $coupon->code,
            'discount_amount' => 10,
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'confirmed',
                'downpayment_amount' => 50,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
        $this->assertDatabaseHas('coupons', ['id' => $coupon->id, 'user_count' => 3]);
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'type' => 'downpayment',
        ]);
    }

    public function test_a_failed_return_handover_rolls_back_the_whole_transition(): void
    {
        $this->mock(ExtraChargeService::class, function (MockInterface $mock) {
            $mock->shouldReceive('previewTotal')->andReturn(0.0);
            $mock->shouldReceive('applyForReturn')->andThrow(new \RuntimeException('simulated storage failure'));
        });

        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->booking('active', 100);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 100,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'PAY-TEST',
        ]);

        VehicleHandover::create([
            'booking_id' => $booking->id,
            'type' => 'pickup',
            'fuel_level' => 8,
            'odometer' => 10000,
            'captured_by' => $admin->id,
            'captured_at' => now(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'completed',
                'return_fuel' => 7,
                'return_odometer' => 10100,
                'no_damage' => '1',
            ])
            ->assertStatus(500);

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'active']);
        $this->assertSame(100.0, (float) $booking->fresh()->total_amount);
        $this->assertDatabaseMissing('vehicle_handovers', [
            'booking_id' => $booking->id,
            'type' => 'return',
        ]);
        $this->assertDatabaseCount('booking_extra_charges', 0);
    }

    private function booking(string $status, float $total): Booking
    {
        $car = Car::factory()->create();
        $guest = Guest::factory()->create();

        return Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'status' => $status,
            'total_amount' => $total,
        ]);
    }
}
