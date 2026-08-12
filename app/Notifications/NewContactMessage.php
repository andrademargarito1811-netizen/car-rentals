<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewContactMessage extends Notification implements ShouldBroadcast
{
    use Queueable;

    public const TYPE = 'contact.message';

    public function __construct(public ContactMessage $contactMessage) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim($this->contactMessage->first_name.' '.$this->contactMessage->last_name);

        return [
            'type' => self::TYPE,
            'title' => 'New contact message',
            'message' => "{$name}: ".($this->contactMessage->subject ?? 'No subject'),
            'icon' => 'mail',
            'action_url' => route('admin.contact-messages.index'),
            'contact_message_id' => $this->contactMessage->id,
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
