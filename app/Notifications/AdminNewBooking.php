<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class AdminNewBooking extends Notification implements ShouldBroadcast
{
    use Queueable;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function via(object $notifiable): array
    {
        return ['broadcast'];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->booking->id,
            'reference_code' => $this->booking->reference_code,
            'customer_name' => $this->booking->guest
                ? $this->booking->guest->first_name . ' ' . $this->booking->guest->last_name
                : 'Guest',
            'car' => $this->booking->car
                ? $this->booking->car->brand . ' ' . $this->booking->car->model
                : 'Unknown',
            'total_amount' => $this->booking->total_amount,
            'status' => $this->booking->status,
        ]);
    }

    public function broadcastType(): string
    {
        return 'booking.created';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.bookings'),
        ];
    }
}
