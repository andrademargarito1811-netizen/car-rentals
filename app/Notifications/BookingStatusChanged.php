<?php

namespace App\Notifications;

use App\Models\Booking;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class BookingStatusChanged extends Notification implements ShouldBroadcast
{
    use Queueable;

    public const TYPE = 'booking.status_changed';

    public function __construct(
        public Booking $booking,
        public string $oldStatus,
        public string $newStatus,
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
            'title' => 'Booking '.ucfirst($this->newStatus),
            'message' => "{$name}'s {$car} rental ({$this->booking->reference_code}) changed from {$this->oldStatus} to {$this->newStatus}",
            'icon' => 'calendar',
            'action_url' => route('admin.bookings.show', $this->booking->id),
            'reference_code' => $this->booking->reference_code,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
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
