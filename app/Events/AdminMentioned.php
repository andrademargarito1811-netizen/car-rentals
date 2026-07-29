<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class AdminMentioned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public Message $message,
        public array $mentionedIds,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.chats'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'mentioned_admin_ids' => $this->mentionedIds,
            'sender_name' => $this->message->sender?->name ?? 'Admin',
            'body' => $this->message->body,
        ];
    }

    public function broadcastAs(): string
    {
        return 'admin.mentioned';
    }
}
