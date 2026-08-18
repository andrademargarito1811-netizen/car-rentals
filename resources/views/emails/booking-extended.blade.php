<x-mail::message>
<x-mail::panel style="text-align: center; font-size: 14px;">
**Reservation Code:**<br>
<span style="font-size: 22px; font-weight: 700; letter-spacing: 2px;">{{ $booking->reference_code }}</span>
</x-mail::panel>

# Your Rental Has Been Extended

Dear **{{ $booking->guest->first_name ?? $booking->user->name ?? 'Customer' }}**,

Good news — your rental has been extended successfully. Here are your updated details:

### Updated Rental Period
<x-mail::table>
|  |  |
|:--|:--|
| **Car** | {{ $booking->car->brand }} {{ $booking->car->model }} ({{ $booking->car->year }}) |
| **Pickup** | {{ $booking->start_date->format('D, M d, Y') }}@if($booking->pickup_time) at {{ \Carbon\Carbon::parse($booking->pickup_time)->format('g:i A') }}@endif |
| **New Return** | <strong>{{ $booking->end_date->format('D, M d, Y') }}@if($booking->return_time) at {{ \Carbon\Carbon::parse($booking->return_time)->format('g:i A') }}@endif</strong> |
</x-mail::table>

### Charges Summary
<x-mail::table>
|  |  |
|:--|:--|
| **Additional Amount Due** | <span style="color: #ea580c;">${{ number_format($additionalAmount, 2) }}</span> |
| **New Total** | <strong>${{ number_format($booking->total_amount, 2) }}</strong> |
@if($booking->remainingBalance() > 0)
| **Remaining Balance** | ${{ number_format($booking->remainingBalance(), 2) }} |
@endif
</x-mail::table>

<x-mail::button :url="route('bookings.guest.show', $booking->reference_code)">
Manage Your Reservation
</x-mail::button>

---

Please settle the additional balance before or at pickup/return. If you have any questions, don't hesitate to reach out to our support team.

Best regards,<br>
**{{ config('app.name') }} Team**
</x-mail::message>
