<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\Payment;
use App\Models\User;
use App\Models\VehicleHandover;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EarlyReturnProrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_early_return_prorates_total_and_lowers_balance_without_refund(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$booking, $pickupAt, $returnedAt] = $this->makeActiveBooking(450.0);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'downpayment',
            'amount' => 100.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-DP',
        ]);

        $this->createPickupHandover($booking, $admin, $pickupAt);

        $this->actingAs($admin)
            ->from(route('admin.bookings.show', $booking->id))
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'completed',
                'returned_at' => $returnedAt->toDateTimeString(),
                'return_fuel' => 8,
                'return_odometer' => 10000,
                'no_damage' => '1',
                'amount' => '50',
            ])
            ->assertRedirect();

        $booking->refresh();

        $this->assertEquals(150.0, (float) $booking->total_amount);
        $this->assertDatabaseMissing('payments', ['booking_id' => $booking->id, 'type' => 'refund']);
        $this->assertEquals(150.0, $booking->totalPaid());
        $this->assertEquals(0.0, $booking->remainingBalance());
    }

    public function test_early_return_after_full_payment_records_automatic_refund(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$booking, $pickupAt, $returnedAt] = $this->makeActiveBooking(450.0);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => 450.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-FULL',
        ]);

        $this->createPickupHandover($booking, $admin, $pickupAt);

        $this->actingAs($admin)
            ->from(route('admin.bookings.show', $booking->id))
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'completed',
                'returned_at' => $returnedAt->toDateTimeString(),
                'return_fuel' => 8,
                'return_odometer' => 10000,
                'no_damage' => '1',
            ])
            ->assertRedirect();

        $booking->refresh();

        $this->assertEquals(150.0, (float) $booking->total_amount);
        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -300.00,
        ]);
        $this->assertEquals(150.0, $booking->totalPaid());
    }

    public function test_late_return_is_not_prorated(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        [$booking, $pickupAt] = $this->makeActiveBooking(450.0);

        Payment::create([
            'booking_id' => $booking->id,
            'type' => 'downpayment',
            'amount' => 100.00,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T-DP',
        ]);

        $this->createPickupHandover($booking, $admin, $pickupAt);

        $lateReturn = now()->addDays(7)->setTime(10, 0, 0);

        $this->actingAs($admin)
            ->from(route('admin.bookings.show', $booking->id))
            ->patch(route('admin.bookings.status', $booking->id), [
                'status' => 'completed',
                'returned_at' => $lateReturn->toDateTimeString(),
                'return_fuel' => 8,
                'return_odometer' => 10000,
                'no_damage' => '1',
                'amount' => '350',
            ])
            ->assertRedirect();

        $booking->refresh();

        $this->assertEquals(450.0, (float) $booking->total_amount);
        $this->assertDatabaseMissing('payments', ['booking_id' => $booking->id, 'type' => 'refund']);
    }

    /**
     * Create an active booking with a reserved 9-day window (3 days before now
     * to 6 days after now at 10:00) at a $50 daily rate ($450 base).
     *
     * @return array{0: Booking, 1: Carbon, 2: Carbon}
     */
    private function makeActiveBooking(float $total): array
    {
        $car = Car::factory()->create([
            'daily_rate' => 50,
            'fuel_charges' => null,
            'free_km_per_day' => null,
            'additional_km_rate' => null,
        ]);
        $guest = Guest::factory()->create();

        $pickupAt = now()->subDays(3)->setTime(10, 0, 0);
        $returnedAt = now()->setTime(10, 0, 0);

        $booking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'status' => 'active',
            'start_date' => now()->subDays(3)->format('Y-m-d'),
            'end_date' => now()->addDays(6)->format('Y-m-d'),
            'pickup_time' => '10:00:00',
            'return_time' => '10:00:00',
            'total_amount' => $total,
        ]);

        return [$booking, $pickupAt, $returnedAt];
    }

    private function createPickupHandover(Booking $booking, User $admin, Carbon $pickupAt): void
    {
        VehicleHandover::create([
            'booking_id' => $booking->id,
            'car_id' => $booking->car_id,
            'type' => 'pickup',
            'fuel_level' => 8,
            'odometer' => 10000,
            'captured_by' => $admin->id,
            'captured_at' => $pickupAt,
        ]);
    }
}
