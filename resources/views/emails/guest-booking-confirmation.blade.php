<x-mail::message>
<img src="{{ $message->embed(public_path('img/company_logo/company-logos-01.png')) }}" alt="{{ config('app.name') }}" style="max-width: 160px; display: block; margin: 0 auto 24px;">

@if ($booking->status === 'pending')
# Reservation Received

Dear **{{ $booking->guest->first_name }} {{ $booking->guest->last_name }}**,

Thank you for choosing **{{ config('app.name') }}**. Your reservation has been received and is currently pending confirmation. We will notify you once it has been confirmed.
@else
# Reservation Confirmed

Dear **{{ $booking->guest->first_name }} {{ $booking->guest->last_name }}**,

Thank you for choosing **{{ config('app.name') }}**. Your reservation has been confirmed and is now being processed.
@endif

<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

### Vehicle Details
<x-mail::table>
|  |  |
|:--|:--|
| **Car** | {{ $booking->car->brand }} {{ $booking->car->model }} ({{ $booking->car->year }}) |
| **Transmission** | {{ $booking->car->transmission ?? '—' }} |
| **Seats** | {{ $booking->car->seats ?? '—' }} |
</x-mail::table>

### Rental Period
<x-mail::table>
|  |  |
|:--|:--|
| **Pickup** | {{ $booking->start_date->format('D, M d, Y') }} @if($booking->pickup_time)at {{ \Carbon\Carbon::parse($booking->pickup_time)->format('g:i A') }}@endif |
| **Return** | {{ $booking->end_date->format('D, M d, Y') }} @if($booking->return_time)at {{ \Carbon\Carbon::parse($booking->return_time)->format('g:i A') }}@endif |
| **Pickup Location** | {{ $booking->pickupLocation?->location ?? $booking->pickupLocation?->address ?? 'TBD' }} |
| **Return Location** | {{ $booking->returnLocation?->location ?? $booking->returnLocation?->address ?? 'TBD' }} |
</x-mail::table>

### Charges Summary
<x-mail::table>
|  |  |
|:--|:--|
| **Total Amount** | <strong>${{ number_format($booking->total_amount, 2) }}</strong> |
@if($booking->status === 'confirmed' && $booking->relationLoaded('payment') && $booking->payment)
| **Downpayment Received** | <span style="color: #16a34a;">${{ number_format($booking->payment->amount, 2) }}</span> |
| **Remaining Balance** | ${{ number_format($booking->remainingBalance(), 2) }} |
@endif
| **Status** | @if($booking->status === 'confirmed')<span style="color: #16a34a;">&#9679; Confirmed</span>@else<span style="color: #f59e0b;">&#9679; Pending</span>@endif |
</x-mail::table>

<x-mail::button :url="route('bookings.guest.show', $booking->reference_code)">
Manage Your Reservation
</x-mail::button>

---

If you have any questions regarding your reservation, please don't hesitate to reach out to our support team.

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
