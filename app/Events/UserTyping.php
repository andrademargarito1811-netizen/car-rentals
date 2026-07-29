<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class UserTyping implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Conversation $conversation,
        public bool $typing,
        public ?string $senderName = null,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.' . $this->conversation->id),
        ];

        if ($this->conversation->guest_token) {
            $channels[] = new Channel('guest-chat.' . $this->conversation->guest_token);
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        return [
            'typing' => $this->typing,
            'conversation_id' => $this->conversation->id,
            'sender_name' => $this->senderName,
        ];
    }

    public function broadcastAs(): string
    {
        return 'user.typing';
    }
}
