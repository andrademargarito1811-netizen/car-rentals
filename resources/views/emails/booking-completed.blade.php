<x-mail::message>
<img src="{{ $message->embed(public_path('img/company_logo/company-logos-01.png')) }}" alt="{{ config('app.name') }}" style="max-width: 160px; display: block; margin: 0 auto 24px;">

# Thank You for Renting With Us

Dear **{{ $booking->guest?->first_name ?? $booking->user?->name ?? 'Valued Customer' }}**,

Thank you for choosing **{{ config('app.name') }}**. We hope you enjoyed your experience with the **{{ $booking->car->brand }} {{ $booking->car->model }}**.

Your rental has been completed successfully.

<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

### Rental Summary
<x-mail::table>
|  |  |
|:--|:--|
| **Car** | {{ $booking->car->brand }} {{ $booking->car->model }} ({{ $booking->car->year }}) |
| **Pickup** | {{ $booking->start_date->format('D, M d, Y') }} @if($booking->pickup_time)at {{ \Carbon\Carbon::parse($booking->pickup_time)->format('g:i A') }}@endif |
| **Return** | {{ $booking->end_date->format('D, M d, Y') }} @if($booking->return_time)at {{ \Carbon\Carbon::parse($booking->return_time)->format('g:i A') }}@endif |
| **Total Paid** | <strong>${{ number_format($booking->total_amount, 2) }}</strong> |
</x-mail::table>

<x-mail::button :url="route('reviews.create', $booking->reference_code)">
Leave a Review
</x-mail::button>

Your feedback helps us improve and helps other travelers make the right choice.

We look forward to serving you again soon!

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
