<?php

namespace Tests\Feature;

use App\Exceptions\BookingExtensionException;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Guest;
use App\Models\Tax;
use App\Models\TaxCategory;
use App\Models\VehicleAvailability;
use App\Models\VehicleClass;
use App\Models\VehicleHandover;
use App\Models\VehicleLocation;
use App\Services\BookingExtensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingExtensionTest extends TestCase
{
    use RefreshDatabase;

    private BookingExtensionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(BookingExtensionService::class);
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

    public function test_extend_confirmed_booking_updates_dates_total_and_taxes(): void
    {
        $car = $this->makeCar();
        $classNo = $car->vehicleClass->class_no;

        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $perDay = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Day',
            'value_in' => 'Amount',
            'rate' => 5,
            'add_or_minus' => true,
        ]);
        $perDay->vehicleClasses()->attach($classNo);

        $booking = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 105.0);

        $this->service->extend($booking, '2026-08-15', '10:00');

        $fresh = $booking->fresh();

        $this->assertEquals('2026-08-15', $fresh->end_date->format('Y-m-d'));
        $this->assertEquals(315.0, (float) $fresh->total_amount);
        $this->assertDatabaseHas('booking_taxes', ['booking_id' => $fresh->id, 'amount' => 15.0]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'booking_extended',
            'model_type' => Booking::class,
            'model_id' => $fresh->id,
        ]);
    }

    public function test_rejects_extension_when_next_booking_confirmed(): void
    {
        $car = $this->makeCar();
        $bookingA = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $this->makeBooking($car, '2026-08-14', '2026-08-16', 'confirmed', 300.0);

        try {
            $this->service->extend($bookingA, '2026-08-15', '10:00');
            $this->fail('Expected BookingExtensionException was not thrown.');
        } catch (BookingExtensionException $e) {
            $this->assertStringContainsString('already reserved', $e->getMessage());
            $this->assertEquals('2026-08-13', $e->maxExtendableDate);
        }

        $fresh = $bookingA->fresh();
        $this->assertEquals('2026-08-13', $fresh->end_date->format('Y-m-d'));
        $this->assertEquals(100.0, (float) $fresh->total_amount);
        $this->assertDatabaseMissing('audit_logs', ['action' => 'booking_extended']);
    }

    public function test_allows_extension_up_to_max_extendable_date(): void
    {
        $car = $this->makeCar();
        $bookingA = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $this->makeBooking($car, '2026-08-15', '2026-08-16', 'confirmed', 200.0);

        $this->service->extend($bookingA, '2026-08-14', '10:00');

        $this->assertEquals('2026-08-14', $bookingA->fresh()->end_date->format('Y-m-d'));
        $this->assertEquals(200.0, (float) $bookingA->fresh()->total_amount);

        // Extending further would collide with the 8/15 booking.
        try {
            $this->service->extend($bookingA, '2026-08-15', '10:00');
            $this->fail('Expected BookingExtensionException was not thrown.');
        } catch (BookingExtensionException $e) {
            $this->assertNotNull($e->maxExtendableDate);
        }
    }

    public function test_quote_conflict_exposes_alternate_cars(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();

        $bookingA = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $this->makeBooking($carA, '2026-08-14', '2026-08-16', 'confirmed', 300.0);

        try {
            $this->service->quote($bookingA, '2026-08-15', '10:00');
            $this->fail('Expected BookingExtensionException was not thrown.');
        } catch (BookingExtensionException $e) {
            $this->assertNotEmpty($e->alternateCars);
            $this->assertEquals($carB->id, $e->alternateCars[0]['id']);
        }
    }

    public function test_can_extend_is_blocked_for_unsupported_states(): void
    {
        $car = $this->makeCar();
        $pending = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'pending', 100.0);
        $this->assertFalse($this->service->canExtend($pending)['allowed']);

        $completed = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'completed', 100.0);
        $this->assertFalse($this->service->canExtend($completed)['allowed']);

        // Already returned.
        $returned = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'active', 100.0);
        VehicleHandover::create([
            'booking_id' => $returned->id,
            'type' => 'return',
            'fuel_level' => 4,
            'odometer' => 1000,
        ]);
        $this->assertFalse($this->service->canExtend($returned)['allowed']);
    }

    public function test_guest_http_quote_returns_422_on_conflict(): void
    {
        $car = $this->makeCar();
        $bookingA = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $this->makeBooking($car, '2026-08-14', '2026-08-16', 'confirmed', 300.0);

        $response = $this->postJson(route('bookings.guest.extend.quote', $bookingA->reference_code), [
            'new_end_date' => '2026-08-15',
            'new_return_time' => '10:00',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('max_extendable_date', '2026-08-13');
    }

    public function test_guest_http_submit_extends_booking(): void
    {
        $car = $this->makeCar();
        $bookingA = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $response = $this->post(route('bookings.guest.extend.submit', $bookingA->reference_code), [
            'new_end_date' => '2026-08-15',
            'new_return_time' => '10:00',
        ]);

        $response->assertRedirect(route('bookings.guest.show', $bookingA->reference_code));

        $fresh = $bookingA->fresh();
        $this->assertEquals('2026-08-15', $fresh->end_date->format('Y-m-d'));
        $this->assertEquals(300.0, (float) $fresh->total_amount);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'booking_extended',
            'model_type' => Booking::class,
            'model_id' => $fresh->id,
        ]);
    }

    public function test_authenticated_user_can_open_extend_page_by_booking_id(): void
    {
        $user = \App\Models\User::factory()->create();
        $car = $this->makeCar();
        $booking = Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'start_date' => '2026-08-12',
            'end_date' => '2026-08-13',
            'pickup_time' => '10:00',
            'return_time' => '10:00',
            'total_amount' => 100.0,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($user)->get(route('bookings.extend.page', $booking->id));

        $response->assertStatus(200);
        $response->assertSessionHasNoErrors();
    }

    public function test_unrelated_user_cannot_open_extend_page(): void
    {
        $user = \App\Models\User::factory()->create();
        $stranger = \App\Models\User::factory()->create();
        $car = $this->makeCar();
        $booking = Booking::factory()->create([
            'user_id' => $user->id,
            'car_id' => $car->id,
            'start_date' => '2026-08-12',
            'end_date' => '2026-08-13',
            'total_amount' => 100.0,
            'status' => 'confirmed',
        ]);

        $this->actingAs($stranger)->get(route('bookings.extend.page', $booking->id))
            ->assertStatus(403);
    }

    public function test_admin_can_open_extend_page_for_any_booking(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $car = $this->makeCar();
        $booking = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $response = $this->actingAs($admin)->get(route('admin.bookings.extend.page', $booking->id));

        $response->assertStatus(200);
        $response->assertSessionHasNoErrors();
        $response->assertInertia(fn ($page) => $page->component('Admin/Bookings/Extend'));
    }

    public function test_admin_extend_page_loads_payments(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $car = $this->makeCar();
        $booking = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        \App\Models\Payment::create([
            'booking_id' => $booking->id,
            'type' => 'partial_payment',
            'amount' => 50.0,
            'payment_method' => 'Cash',
            'payment_status' => 'completed',
        ]);

        $this->actingAs($admin)->get(route('admin.bookings.extend.page', $booking->id))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page->component('Admin/Bookings/Extend')
                ->has('booking.payments', 1));
    }

    public function test_rebook_creates_new_booking_on_alternate_car(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar(['daily_rate' => 150]);

        $category = TaxCategory::factory()->create(['name' => 'Tax']);
        $perDay = Tax::factory()->create([
            'category_id' => $category->id,
            'calculation' => 'Per Day',
            'value_in' => 'Amount',
            'rate' => 5,
            'add_or_minus' => true,
        ]);
        $perDay->vehicleClasses()->attach($carB->vehicleClass->class_no);

        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 105.0);
        $originalGuestId = $booking->guest_id;

        $new = $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        $this->assertNotEquals($booking->id, $new->id);
        $this->assertEquals($carB->id, $new->car_id);
        $this->assertEquals($originalGuestId, $new->guest_id);
        $this->assertEquals('2026-08-13', $new->start_date->format('Y-m-d'));
        $this->assertEquals('2026-08-15', $new->end_date->format('Y-m-d'));
        $this->assertEquals('pending', $new->status);
        $this->assertNotNull($new->reference_code);
        $this->assertNotEquals($booking->reference_code, $new->reference_code);
        $this->assertEquals(310.0, (float) $new->total_amount); // 2 × 150 + 2 × 5
        $this->assertDatabaseHas('booking_taxes', ['booking_id' => $new->id, 'amount' => 10.0]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'booking_rebooked',
            'model_id' => $new->id,
        ]);

        $original = $booking->fresh();
        $this->assertEquals($carA->id, $original->car_id);
        $this->assertEquals('2026-08-13', $original->end_date->format('Y-m-d'));
        $this->assertEquals(105.0, (float) $original->total_amount);
    }

    public function test_rebook_allows_car_occupied_before_switchover(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        // carB is occupied during the ORIGINAL window (before the switchover)
        // but free from the extension window on — this must NOT block a rebook.
        $other = $this->makeBooking($carB, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $other->update(['return_time' => '08:00']);

        $new = $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        $this->assertEquals($carB->id, $new->car_id);
        $this->assertEquals($carA->id, $booking->fresh()->car_id);
    }

    public function test_rebook_rejects_car_conflicting_with_extension_window(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $this->makeBooking($carB, '2026-08-14', '2026-08-15', 'confirmed', 100.0);

        try {
            $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');
            $this->fail('Expected BookingExtensionException was not thrown.');
        } catch (BookingExtensionException $e) {
            $this->assertStringContainsString('not available', $e->getMessage());
            $this->assertEquals('2026-08-13', $e->maxExtendableDate);
        }
    }

    public function test_swap_quote_prices_new_reservation_window(): void
    {
        $carA = $this->makeCar(['daily_rate' => 300]);
        $carB = $this->makeCar(['daily_rate' => 50]);
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 300.0);

        $quote = $this->service->quote($booking, '2026-08-15', '10:00', $carB->id);

        $this->assertTrue($quote['is_swap']);
        $this->assertEquals($carB->id, $quote['car_id']);
        // New booking window: 8/13 10:00 → 8/15 10:00 = 2 days × 50 = 100.
        $this->assertEquals(2, $quote['extension_days']);
        $this->assertEquals(100.0, $quote['new_total_amount']);
        $this->assertEquals(100.0, $quote['additional_total']);
    }

    public function test_same_day_next_booking_exposes_max_return_time(): void
    {
        $car = $this->makeCar();
        $booking = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $next = $this->makeBooking($car, '2026-08-13', '2026-08-14', 'confirmed', 100.0);
        $next->update(['pickup_time' => '14:00', 'return_time' => '14:00']);

        $quote = $this->service->quote($booking, '2026-08-13', '12:00');

        $this->assertEquals('2026-08-13', $quote['max_extendable_date']);
        $this->assertEquals('14:00', $quote['max_return_time']);

        // Extending the time past the same-day pickup is rejected.
        try {
            $this->service->quote($booking, '2026-08-13', '15:00');
            $this->fail('Expected BookingExtensionException was not thrown.');
        } catch (BookingExtensionException $e) {
            $this->assertStringContainsString('already reserved', $e->getMessage());
        }

        // No same-day successor -> no time cap (the date cap governs instead).
        $free = $this->makeCar();
        $freeBooking = $this->makeBooking($free, '2026-08-12', '2026-08-13', 'confirmed', 100.0);
        $this->assertNull($this->service->quote($freeBooking, '2026-08-13', '20:00')['max_return_time']);
    }

    public function test_swap_quote_returns_new_car_info(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $quote = $this->service->quote($booking, '2026-08-15', '10:00', $carB->id);

        $this->assertTrue($quote['is_swap']);
        $this->assertEquals($carB->id, $quote['car']['id']);
        $this->assertEquals($carB->model, $quote['car']['model']);
    }

    public function test_guest_http_submit_creates_new_booking_for_swap(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $bookingA = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $response = $this->post(route('bookings.guest.extend.submit', $bookingA->reference_code), [
            'new_end_date' => '2026-08-15',
            'new_return_time' => '10:00',
            'car_id' => $carB->id,
        ]);

        $new = Booking::where('guest_id', $bookingA->guest_id)
            ->where('id', '!=', $bookingA->id)
            ->orderBy('id', 'desc')
            ->first();

        $this->assertNotNull($new);
        $this->assertEquals($carB->id, $new->car_id);
        $this->assertEquals(200.0, (float) $new->total_amount); // 2 × 100
        $response->assertRedirect(route('bookings.guest.show', $new->reference_code));

        $original = $bookingA->fresh();
        $this->assertEquals($carA->id, $original->car_id);
        $this->assertEquals('2026-08-13', $original->end_date->format('Y-m-d'));
        $this->assertEquals(100.0, (float) $original->total_amount);
    }

    public function test_rebook_links_source_and_child_bookings(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $new = $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        $this->assertEquals($booking->id, $new->extensionSource()->id);
        $this->assertEquals($new->id, $booking->extensionChildren()->first()->id);
    }

    public function test_guest_show_page_exposes_related_reservations(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $new = $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        // Original booking shows the extension it grew into.
        $this->get(route('bookings.guest.show', $booking->reference_code))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Bookings/GuestShow')
                ->has('booking.extension_children', 1)
                ->where('booking.extension_children.0.id', $new->id));

        // The new reservation points back to its source.
        $this->get(route('bookings.guest.show', $new->reference_code))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Bookings/GuestShow')
                ->where('booking.extension_source.id', $booking->id));
    }

    public function test_admin_initiated_rebook_emails_guest_confirmation(): void
    {
        Mail::fake();

        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        Mail::assertQueued(GuestBookingConfirmation::class);
    }

    public function test_activity_timeline_includes_rebook_event(): void
    {
        $carA = $this->makeCar();
        $carB = $this->makeCar();
        $booking = $this->makeBooking($carA, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $this->service->rebook($booking, $carB->id, '2026-08-15', '10:00');

        $types = $booking->fresh()->activityTimeline()->pluck('type');

        $this->assertContains('created', $types);
        $this->assertContains('rebook', $types);
        $this->assertCount(2, $types);
    }

    public function test_admin_show_page_exposes_activity_timeline(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $car = $this->makeCar();
        $booking = $this->makeBooking($car, '2026-08-12', '2026-08-13', 'confirmed', 100.0);

        $this->actingAs($admin)->get(route('admin.bookings.show', $booking->id))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Bookings/Show')
                ->has('booking.timeline'));
    }
}
