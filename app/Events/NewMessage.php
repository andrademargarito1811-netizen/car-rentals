<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class NewMessage implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, InteractsWithBroadcasting;

    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        $this->message->loadMissing('conversation');

        $channels = [
            new PrivateChannel('conversation.' . $this->message->conversation_id),
        ];

        if ($this->message->sender_type !== 'system') {
            $channels[] = new PrivateChannel('admin.chats');
        }

        if ($this->message->conversation->guest_token && !$this->message->is_internal) {
            $channels[] = new Channel('guest-chat.' . $this->message->conversation->guest_token);
        }

        return $channels;
    }

    public function broadcastWith(): array
    {
        $this->message->loadMissing('sender:id,name', 'conversation');
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
            'sender_type' => $this->message->sender_type,
            'sender_name' => $this->message->sender?->name ?? ($this->message->sender_type === 'guest'
                ? ($this->message->conversation->guest_name ?? 'Guest')
                : 'Admin'),
            'body' => $this->message->body,
            'created_at' => $this->message->created_at->toISOString(),
            'is_internal' => $this->message->is_internal,
            'mentioned_admin_ids' => $this->message->mentioned_admin_ids ?? [],
            'guest_name' => $this->message->conversation->guest_name,
            'guest_email' => $this->message->conversation->guest_email,
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
