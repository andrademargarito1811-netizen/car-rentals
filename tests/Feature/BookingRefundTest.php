<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\User;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleLocation;
use App\Services\BookingModificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_decreasing_a_paid_booking_total_records_a_refund(): void
    {
        // Booking total (500) is higher than the recomputed rental rate (3 days x $100 = 300),
        // so modifying with the same dates drops the total below what was paid.
        $booking = $this->makeBooking(500, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-PAID',
        ]);

        (app(BookingModificationService::class))->modify($booking, [
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
        ]);

        $booking->refresh();

        $this->assertEquals(300.0, (float) $booking->total_amount);
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -200.00,
        ]);
        $this->assertEquals(300.0, $booking->totalPaid());
        $this->assertEquals(0.0, $booking->remainingBalance());
    }

    public function test_increasing_booking_total_does_not_record_a_refund(): void
    {
        // Booking total (200) is lower than the recomputed rental rate (3 days x $100 = 300),
        // so modifying with the same dates raises the total above what was paid.
        $booking = $this->makeBooking(200, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'downpayment',
            'amount' => 100.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-DP',
        ]);

        (app(BookingModificationService::class))->modify($booking, [
            'pickup_date' => now()->addDays(2)->format('Y-m-d'),
            'return_date' => now()->addDays(4)->format('Y-m-d'),
        ]);

        $booking->refresh();

        $this->assertEquals(300.0, (float) $booking->total_amount);
        $this->assertDatabaseMissing('payments', [
            'booking_id' => $booking->id,
            'type' => 'refund',
        ]);
    }

    public function test_admin_can_record_a_refund_via_endpoint(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->makeBooking(500, 100.00, 5);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-FULL',
        ]);

        $this->actingAs($admin)
            ->post(route('admin.bookings.payments.store', $booking->id), [
                'amount' => 200,
                'payment_method' => 'Cash',
                'type' => 'refund',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -200.00,
        ]);
    }

    public function test_fully_refunded_booking_blocks_new_payments(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->makeBooking(500, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-IN',
        ]);
        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-OUT',
        ]);

        $booking->refresh();

        $this->assertTrue($booking->isFullyRefunded());
        $this->assertEquals(0.0, $booking->totalPaid());

        $this->actingAs($admin)
            ->post(route('admin.bookings.payments.store', $booking->id), [
                'amount' => 100,
                'payment_method' => 'Cash',
                'type' => 'remaining',
            ])
            ->assertSessionHasErrors('amount');
    }

    public function test_fully_refunded_booking_blocks_editing_refund(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->makeBooking(500, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-IN',
        ]);
        $refund = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-OUT',
        ]);

        $booking->refresh();
        $this->assertTrue($booking->isFullyRefunded());

        $this->actingAs($admin)
            ->patch(route('admin.bookings.payments.update', [$booking->id, $refund->id]), [
                'amount' => -250,
                'payment_method' => 'Cash',
            ])
            ->assertSessionHasErrors('amount');

        $refund->refresh();
        $this->assertEquals(-500.00, (float) $refund->amount);
    }

    public function test_editing_refund_cannot_exceed_refundable_amount(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->makeBooking(500, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-IN',
        ]);
        $refund = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -200.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-OUT',
        ]);

        $booking->refresh();
        $this->assertFalse($booking->isFullyRefunded());

        $this->actingAs($admin)
            ->patch(route('admin.bookings.payments.update', [$booking->id, $refund->id]), [
                'amount' => -600,
                'payment_method' => 'Cash',
            ])
            ->assertSessionHasErrors('amount');

        $refund->refresh();
        $this->assertEquals(-200.00, (float) $refund->amount);
    }

    public function test_editing_refund_within_refundable_amount_succeeds(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $booking = $this->makeBooking(500, 100.00, 3);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 500.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-IN',
        ]);
        $refund = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -200.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-OUT',
        ]);

        $booking->refresh();

        $this->actingAs($admin)
            ->patch(route('admin.bookings.payments.update', [$booking->id, $refund->id]), [
                'amount' => -300,
                'payment_method' => 'Bank Transfer',
            ])
            ->assertRedirect();

        $refund->refresh();
        $this->assertEquals(-300.00, (float) $refund->amount);
    }

    private function makeBooking(float $total, float $dailyRate, int $days): Booking
    {
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);
        $car = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
            'daily_rate' => $dailyRate,
        ]);
        $guest = Guest::factory()->create();

        return Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->addDays(2)->format('Y-m-d'),
            'end_date' => now()->addDays(1 + $days)->format('Y-m-d'),
            'total_amount' => $total,
            'status' => 'confirmed',
        ]);
    }
}
