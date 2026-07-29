<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class MessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Conversation $conversation,
        public int $userId,
        public string $userType,
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
            'read_by_user_id' => $this->userId,
            'read_by' => $this->userType,
            'conversation_id' => $this->conversation->id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'messages.read';
    }
}
