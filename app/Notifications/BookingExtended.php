<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class BookingExtended extends Notification implements ShouldBroadcast
{
    use Queueable;

    public const TYPE = 'booking.extended';

    public function __construct(
        public Booking $booking,
        public float $additionalAmount,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $this->booking->loadMissing(['guest', 'user', 'car']);

        $name = $this->booking->guest
            ? trim($this->booking->guest->first_name.' '.$this->booking->guest->last_name)
            : ($this->booking->user?->name ?? 'A guest');

        $car = $this->booking->car
            ? $this->booking->car->brand.' '.$this->booking->car->model
            : 'a vehicle';

        return [
            'type' => self::TYPE,
            'title' => 'Rental extended',
            'message' => "{$name}'s {$car} rental ({$this->booking->reference_code}) extended to "
                .$this->booking->end_date->format('M d, Y')
                .' — additional $'.number_format($this->additionalAmount, 2),
            'icon' => 'calendar-plus',
            'action_url' => route('admin.bookings.show', $this->booking->id),
            'reference_code' => $this->booking->reference_code,
            'new_end_date' => $this->booking->end_date->format('Y-m-d'),
            'additional_amount' => $this->additionalAmount,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastAs(): string
    {
        return 'notification.received';
    }

    public function broadcastType(): string
    {
        return self::TYPE;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.bookings'),
        ];
    }
}
