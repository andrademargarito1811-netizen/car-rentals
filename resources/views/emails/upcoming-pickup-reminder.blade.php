<x-mail::message>
<img src="{{ $message->embed($footerSettings?->logo_disk_path ?? public_path('img/company_logo/company-logos-01.png')) }}" alt="{{ config('app.name') }}" style="max-width: 160px; display: block; margin: 0 auto 24px;">

# Pickup Reminder

Dear **{{ $booking->guest?->first_name ?? $booking->user?->name ?? 'Valued Customer' }}**,

Your rental is scheduled to begin **tomorrow**. Here are the details:

<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

<x-mail::table>
|  |  |
|:--|:--|
| **Car** | {{ $booking->car->brand }} {{ $booking->car->model }} ({{ $booking->car->year }}) |
| **Pickup** | {{ $booking->start_date->format('D, M d, Y') }} @if($booking->pickup_time)at {{ \Carbon\Carbon::parse($booking->pickup_time)->format('g:i A') }}@endif |
| **Pickup Location** | {{ $booking->pickupLocation?->location ?? $booking->pickupLocation?->address ?? 'TBD' }} |
| **Return** | {{ $booking->end_date->format('D, M d, Y') }} @if($booking->return_time)at {{ \Carbon\Carbon::parse($booking->return_time)->format('g:i A') }}@endif |
</x-mail::table>

Please bring a valid driver's license and the payment method used for your reservation.

<x-mail::button :url="route('bookings.guest.show', $booking->reference_code)">
Manage Your Reservation
</x-mail::button>

If you need to make changes, please contact us as soon as possible.

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
