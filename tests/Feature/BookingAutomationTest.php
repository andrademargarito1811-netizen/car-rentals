<?php

namespace Tests\Feature;

use App\Mail\OverdueReturnNotice;
use App\Mail\UpcomingPickupReminder;
use App\Mail\UpcomingReturnReminder;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_auto_cancel_cancels_expired_pending_bookings_only(): void
    {
        $car = Car::factory()->create();
        $guest = Guest::factory()->create();

        $expired = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->subDays(5)->format('Y-m-d'),
            'end_date' => now()->subDays(3)->format('Y-m-d'),
            'status' => 'pending',
        ]);
        $future = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->addDays(5)->format('Y-m-d'),
            'end_date' => now()->addDays(7)->format('Y-m-d'),
            'status' => 'pending',
        ]);

        $this->artisan('bookings:auto-cancel')->assertExitCode(0);

        $this->assertDatabaseHas('bookings', ['id' => $expired->id, 'status' => 'cancelled']);
        $this->assertDatabaseHas('bookings', ['id' => $future->id, 'status' => 'pending']);
        $this->assertDatabaseHas('audit_logs', [
            'model_id' => (string) $expired->id,
            'action' => 'booking_auto_cancelled',
        ]);
    }

    public function test_reminder_command_sends_once_per_booking_per_day(): void
    {
        Mail::fake();

        $car = Car::factory()->create();
        $guest = Guest::factory()->create(['email' => 'customer@example.com']);

        Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->addDay()->format('Y-m-d'),
            'end_date' => now()->addDays(3)->format('Y-m-d'),
            'status' => 'confirmed',
        ]);
        Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->subDays(2)->format('Y-m-d'),
            'end_date' => now()->addDay()->format('Y-m-d'),
            'status' => 'active',
        ]);
        Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->subDays(5)->format('Y-m-d'),
            'end_date' => now()->subDays(1)->format('Y-m-d'),
            'status' => 'active',
        ]);

        $this->artisan('bookings:send-reminders')->assertExitCode(0);

        Mail::assertQueued(UpcomingPickupReminder::class);
        Mail::assertQueued(UpcomingReturnReminder::class);
        Mail::assertQueued(OverdueReturnNotice::class);
        Mail::assertQueuedCount(3);

        $this->artisan('bookings:send-reminders')->assertExitCode(0);

        Mail::assertQueuedCount(3);
    }
}
