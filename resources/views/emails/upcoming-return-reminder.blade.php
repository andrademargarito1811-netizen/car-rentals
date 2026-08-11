<x-mail::message>
<img src="{{ $message->embed($footerSettings?->logo_disk_path ?? public_path('img/company_logo/company-logos-01.png')) }}" alt="{{ config('app.name') }}" style="max-width: 160px; display: block; margin: 0 auto 24px;">

# Return Reminder

Dear **{{ $booking->guest?->first_name ?? $booking->user?->name ?? 'Valued Customer' }}**,

Your rental of the **{{ $booking->car->brand }} {{ $booking->car->model }}** is due back **tomorrow**. Here are the return details:

<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

<x-mail::table>
|  |  |
|:--|:--|
| **Return** | {{ $booking->end_date->format('D, M d, Y') }} @if($booking->return_time)at {{ \Carbon\Carbon::parse($booking->return_time)->format('g:i A') }}@endif |
| **Return Location** | {{ $booking->returnLocation?->location ?? $booking->returnLocation?->address ?? 'TBD' }} |
</x-mail::table>

Please return the vehicle on time with the same fuel level it had at pickup to avoid additional charges.

<x-mail::button :url="route('bookings.guest.show', $booking->reference_code)">
Manage Your Reservation
</x-mail::button>

If you need to extend your rental, please contact us right away.

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
