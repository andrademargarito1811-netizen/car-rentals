<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;

class AdminNotificationService
{
    /**
     * Send a notification to every admin, excluding the acting user (when any).
     * Side effects are wrapped so a broadcast/database failure never breaks the
     * main request flow.
     */
    public static function send(Notification $notification, ?int $exceptUserId = null): void
    {
        try {
            $admins = User::admins()
                ->when($exceptUserId ?? auth()->id(), fn ($q, $id) => $q->where('id', '!=', $id))
                ->get();

            if ($admins->isNotEmpty()) {
                NotificationFacade::send($admins, $notification);
            }
        } catch (\Throwable $e) {
            Log::warning('Admin notification failed: '.$e->getMessage());
        }
    }
}
