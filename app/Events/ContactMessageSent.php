<?php

namespace App\Events;

use App\Models\ContactMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContactMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public ContactMessage $contactMessage;

    public function __construct(ContactMessage $contactMessage)
    {
        $this->contactMessage = $contactMessage;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.bookings'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->contactMessage->id,
            'first_name' => $this->contactMessage->first_name,
            'last_name' => $this->contactMessage->last_name,
            'email' => $this->contactMessage->email,
            'subject' => $this->contactMessage->subject,
            'created_at' => $this->contactMessage->created_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'contact.message.sent';
    }
}
