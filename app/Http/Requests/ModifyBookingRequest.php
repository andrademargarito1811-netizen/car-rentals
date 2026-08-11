<?php

namespace App\Http\Requests;

use App\Models\Booking;
use Illuminate\Foundation\Http\FormRequest;

class ModifyBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        $booking = $this->route('booking');
        if (! $booking) {
            $reference = $this->route('reference');
            if ($reference) {
                $booking = Booking::where('reference_code', $reference)->first();
            }
        }

        if (! $user && $booking && ! $booking->user_id) {
            return $booking->status === 'pending';
        }

        return $booking && ($booking->user_id === $user?->id || $user?->isAdmin());
    }

    public function rules(): array
    {
        return [
            'car_id' => 'sometimes|exists:tblcars,id',
            'pickup_date' => 'sometimes|date|after_or_equal:today',
            'pickup_time' => 'nullable|string',
            'pickup_location' => 'nullable|string|max:255',
            'return_date' => 'sometimes|date|after_or_equal:pickup_date',
            'return_time' => 'nullable|string',
            'return_location' => 'nullable|string|max:255',

            'title' => 'nullable|string|max:10',
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'driver_age' => 'nullable|integer|min:18|max:120',
            'phone' => 'nullable|string|max:30',
            'email' => 'sometimes|email|max:255',
            'address' => 'nullable|string|max:255',
            'address2' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'company_name' => 'nullable|string|max:150',
            'flight_no' => 'nullable|string|max:50',

            'coupon_code' => 'nullable|string|max:16',
            'notes' => 'nullable|string',
        ];
    }
}
