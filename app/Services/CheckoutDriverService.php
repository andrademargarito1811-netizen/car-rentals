<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Driver;

class CheckoutDriverService
{
    /**
     * Record driver license details and the guest company at vehicle check-out.
     * Keeps the existing attached driver untouched when no new license number is
     * supplied (e.g. bookings created through the admin quick-book panel).
     */
    public function save(Booking $booking, array $data): void
    {
        $guest = $booking->guest;

        if ($guest && !empty($data['company_name'])) {
            $guest->update(['company_name' => $data['company_name']]);
        }

        $licenseNumber = trim((string) ($data['license_number'] ?? ''));

        if ($licenseNumber === '') {
            $this->updateExistingDriverDetails($booking, $data);
            return;
        }

        $hash = hash('sha256', strtoupper($licenseNumber));
        $driver = Driver::where('license_number_hash', $hash)->first();

        $values = [
            'first_name' => $data['driver_first_name'] ?? null,
            'last_name' => $data['driver_last_name'] ?? null,
            'birth_date' => $data['driver_birth_date'] ?? null,
            'license_number' => $licenseNumber,
            'license_number_hash' => $hash,
            'license_category' => $data['license_category'] ?? null,
            'license_expiry' => $data['license_expiry'] ?? null,
        ];

        $guestId = $guest?->guest_id;
        $isRenter = filter_var($data['driver_is_renter'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (!$driver) {
            $values['guest_id'] = $isRenter ? $guestId : null;
            $driver = Driver::create($values);
        } else {
            if (!$driver->guest_id && $isRenter && $guestId) {
                $values['guest_id'] = $guestId;
            }
            $driver->update($values);
        }

        $booking->update(['driver_id' => $driver->driver_id]);
    }

    private function updateExistingDriverDetails(Booking $booking, array $data): void
    {
        $driver = $booking->driver;
        if (!$driver) {
            return;
        }

        $updates = array_filter([
            'first_name' => $data['driver_first_name'] ?? null,
            'last_name' => $data['driver_last_name'] ?? null,
            'birth_date' => $data['driver_birth_date'] ?? null,
            'license_category' => $data['license_category'] ?? null,
            'license_expiry' => $data['license_expiry'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        if (!empty($updates)) {
            $driver->update($updates);
        }
    }
}
