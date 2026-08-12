<?php

namespace App\Notifications;

use App\Models\Review;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewReview extends Notification implements ShouldBroadcast
{
    use Queueable;

    public const TYPE = 'review.submitted';

    public function __construct(public Review $review) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $this->review->loadMissing(['car', 'guest', 'user']);

        $name = $this->review->user?->name
            ?? trim(($this->review->guest?->first_name ?? '').' '.($this->review->guest?->last_name ?? ''))
            ?: 'A customer';

        $car = $this->review->car
            ? $this->review->car->brand.' '.$this->review->car->model
            : 'a vehicle';

        return [
            'type' => self::TYPE,
            'title' => 'New review',
            'message' => "{$name} rated {$car} {$this->review->rating}/5 — pending approval",
            'icon' => 'star',
            'action_url' => route('admin.reviews.index', ['status' => 'pending']),
            'review_id' => $this->review->id,
            'rating' => $this->review->rating,
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
