<?php

use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('admin.bookings', function ($user) {
    return $user && $user->isAdmin();
});

Broadcast::channel('admin.chats', function ($user) {
    return $user && $user->isAdmin() ? ['id' => $user->id, 'name' => $user->name] : false;
});

Broadcast::channel('conversation.{id}', function ($user, $id) {
    if (!$user) {
        return false;
    }
    $conversation = Conversation::find($id);
    if (!$conversation) {
        return false;
    }
    if ($user->isAdmin()) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'admin'];
    }
    if ($conversation->user_id === $user->id) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'user'];
    }
    return false;
});
