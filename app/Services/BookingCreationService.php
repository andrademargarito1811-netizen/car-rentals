<?php

namespace App\Services;

use App\Events\BookingCreated;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\CouponUsage;
use App\Models\Driver;
use App\Models\Guest;
use App\Models\VehicleLocation;
use App\Notifications\AdminNewBooking;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BookingCreationService
{
    public function __construct(
        private BookingPricingService $pricing,
    ) {}

    public function create(array $data, ?Request $request = null): Booking
    {
        return DB::transaction(function () use ($data, $request) {
            $car = Car::with('vehicleClass')->findOrFail($data['car_id']);
            $graceMinutes = $car->getGraceMinutes();

            $newPickup = $data['pickup_date'].' '.($data['pickup_time'] ?? '00:00:00');
            $newReturn = $data['return_date'].' '.($data['return_time'] ?? '23:59:59');
            $overlapExists = Booking::overlappingBetween($data['car_id'], $newPickup, $newReturn, $graceMinutes)->exists();
            if ($overlapExists) {
                abort(422, 'The selected car already has a booking that overlaps with these dates and times.');
            }

            $pickupLocation = ! empty($data['pickup_location'])
                ? VehicleLocation::where('location', $data['pickup_location'])->value('location_id')
                : null;
            $returnLocation = ! empty($data['return_location'])
                ? VehicleLocation::where('location', $data['return_location'])->value('location_id')
                : null;

            $price = $this->pricing->calculate(
                $car,
                $data['pickup_date'],
                $data['pickup_time'] ?? null,
                $data['return_date'],
                $data['return_time'] ?? null,
                $pickupLocation,
                $data['coupon_code'] ?? null,
            );

            $guest = Guest::create([
                'email' => $data['email'],
                'title' => $data['title'] ?? null,
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'company_name' => $data['company_name'] ?? null,
                'driver_age' => $data['driver_age'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'address2' => $data['address2'] ?? null,
                'country' => $data['country'] ?? null,
                'state' => $data['state'] ?? null,
                'city' => $data['city'] ?? null,
                'postal_code' => $data['postal_code'] ?? null,
                'flight_no' => $data['flight_no'] ?? null,
            ]);

            $driver = $this->createOrUpdateDriver($data, $guest);

            $booking = Booking::create([
                'guest_id' => $guest->guest_id,
                'driver_id' => $driver?->driver_id,
                'car_id' => $data['car_id'],
                'start_date' => $data['pickup_date'],
                'end_date' => $data['return_date'],
                'pickup_time' => $data['pickup_time'] ?? null,
                'return_time' => $data['return_time'] ?? null,
                'pickup_location_id' => $pickupLocation,
                'return_location_id' => $returnLocation,
                'total_amount' => $price['total'],
                'status' => 'pending',
                'notes' => null,
            ]);

            if ($price['coupon'] && $price['coupon_discount'] > 0) {
                CouponUsage::create([
                    'booking_id' => $booking->id,
                    'coupon_id' => $price['coupon']->id,
                    'code' => $price['coupon']->code,
                    'discount_amount' => $price['coupon_discount'],
                ]);
            }

            foreach ($price['taxes'] as $item) {
                BookingTax::create([
                    'booking_id' => $booking->id,
                    'tax_id' => $item['id'] ?? null,
                    'tax_desc' => $item['tax_desc'],
                    'amount' => $item['amount'],
                    'add_or_minus' => $item['add_or_minus'],
                ]);
            }

            $ip = $request?->ip();
            $ua = $request?->userAgent();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'booking_created',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => "Guest booking created for {$car->brand} {$car->model} by {$guest->first_name} {$guest->last_name}",
                'ip_address' => $ip,
                'user_agent' => $ua,
            ]);

            try {
                event(new BookingCreated($booking));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed for booking #'.$booking->id.': '.$e->getMessage());
            }

            AdminNotificationService::send(new AdminNewBooking($booking));

            if (! auth()->check()) {
                try {
                    Mail::to($guest->email)->queue(new GuestBookingConfirmation($booking));
                } catch (\Throwable $e) {
                    Log::warning('Confirmation email failed for booking #'.$booking->id.': '.$e->getMessage());
                }
            }

            return $booking;
        });
    }

    private function createOrUpdateDriver(array $data, Guest $guest): ?Driver
    {
        $licenseNumber = trim($data['license_number'] ?? '');
        if ($licenseNumber === '') {
            return null;
        }

        $hash = hash('sha256', strtoupper($licenseNumber));
        $driver = Driver::where('license_number_hash', $hash)->first();

        $values = [
            'first_name' => $data['driver_first_name'],
            'last_name' => $data['driver_last_name'],
            'birth_date' => $data['driver_birth_date'],
            'license_number' => $licenseNumber,
            'license_number_hash' => $hash,
            'license_category' => $data['license_category'],
            'license_expiry' => $data['license_expiry'],
        ];

        if (! $driver) {
            $values['guest_id'] = ! empty($data['driver_is_renter']) ? $guest->guest_id : null;
            $driver = Driver::create($values);
        } else {
            if (! $driver->guest_id && ! empty($data['driver_is_renter'])) {
                $values['guest_id'] = $guest->guest_id;
            }
            $driver->update($values);
        }

        return $driver;
    }
}
