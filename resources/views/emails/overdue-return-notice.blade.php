<x-mail::message>
<img src="{{ $message->embed($footerSettings?->logo_disk_path ?? public_path('img/company_logo/company-logos-01.png')) }}" alt="{{ config('app.name') }}" style="max-width: 160px; display: block; margin: 0 auto 24px;">

# Rental Return Overdue

Dear **{{ $booking->guest?->first_name ?? $booking->user?->name ?? 'Valued Customer' }}**,

Our records show that the **{{ $booking->car->brand }} {{ $booking->car->model }}** was due back on **{{ $booking->end_date->format('D, M d, Y') }}** and has not yet been returned.

Please return the vehicle as soon as possible, or contact us immediately to arrange an extension.

<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

Please note that additional daily charges may apply for every day the vehicle remains out beyond your scheduled return date.

<x-mail::button :url="route('bookings.guest.show', $booking->reference_code)">
View Your Reservation
</x-mail::button>

We appreciate your prompt attention to this matter.

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
