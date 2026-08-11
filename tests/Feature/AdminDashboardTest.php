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
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_filters_stats_by_period(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $car = Car::factory()->create();
        $guest = Guest::factory()->create();

        $oldBooking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'status' => 'completed',
            'total_amount' => 100,
        ]);
        $oldBooking->timestamps = false;
        $oldBooking->forceFill(['created_at' => now()->subMonths(6)])->save();
        $this->payment($oldBooking, 100, now()->subMonths(6));

        $recentBooking = Booking::factory()->create([
            'car_id' => $car->id,
            'guest_id' => $guest->guest_id,
            'status' => 'completed',
            'total_amount' => 50,
        ]);
        $this->payment($recentBooking, 50, now()->subDays(2));

        $this->actingAs($admin)
            ->get(route('admin.dashboard', ['period' => '7d']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin_panel/Dashboard')
                ->where('period', '7d')
                ->where('revenue', 50)
                ->where('total_bookings', 1));

        $this->actingAs($admin)
            ->get(route('admin.dashboard', ['period' => 'all']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('period', 'all')
                ->where('revenue', 150)
                ->where('total_bookings', 2));
    }

    public function test_available_for_rent_excludes_cars_in_active_bookings_today(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $location = VehicleLocation::factory()->create();
        $class = VehicleClass::factory()->create();
        $availability = VehicleAvailability::factory()->create(['available_desc' => 'available']);

        $freeCar = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);
        $rentedCar = Car::factory()->create([
            'location_id' => $location->location_id,
            'class_id' => $class->class_no,
            'availability_id' => $availability->available_id,
        ]);

        $guest = Guest::factory()->create();
        Booking::factory()->create([
            'car_id' => $rentedCar->id,
            'guest_id' => $guest->guest_id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('available_cars', 2)
                ->where('available_for_rent', 1));
    }

    private function payment(Booking $booking, float $amount, Carbon $createdAt): Payment
    {
        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'full_payment',
            'amount' => $amount,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
            'transaction_id' => 'T'.random_int(1000, 9999),
        ]);

        $payment->timestamps = false;
        $payment->forceFill(['created_at' => $createdAt])->save();

        return $payment;
    }
}
