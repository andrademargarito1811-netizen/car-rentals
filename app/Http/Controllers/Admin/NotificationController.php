<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $filter = $request->get('filter', 'all');
        $type = $request->get('type', 'all');

        $query = $user->notifications();
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($type !== 'all') {
            $query->where('data->type', $type);
        }

        $notifications = $query->orderByDesc('created_at')->paginate(15)->withQueryString();

        $notifications->getCollection()->transform(fn ($n) => [
            'id' => $n->id,
            'data' => $n->data,
            'read_at' => $n->read_at,
            'created_at' => $n->created_at,
        ]);

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $notifications,
            'filter' => $filter,
            'type' => $type,
            'stats' => [
                'total' => $user->notifications()->count(),
                'unread' => $user->unreadNotifications()->count(),
            ],
        ]);
    }

    public function markAsRead(Request $request, DatabaseNotification $notification)
    {
        if ($notification->notifiable_id !== $request->user()->getAuthIdentifier()) {
            abort(403);
        }

        $notification->markAsRead();

        return redirect()->back();
    }

    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return redirect()->back()->with('success', 'All notifications marked as read.');
    }

    public function bulkMarkAsRead(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['uuid'],
        ]);

        $request->user()->notifications()
            ->whereKey($validated['ids'])
            ->update(['read_at' => now()]);

        return redirect()->back();
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['uuid'],
        ]);

        $count = $request->user()->notifications()
            ->whereKey($validated['ids'])
            ->delete();

        return redirect()->back()->with('success', $count.' notification'.($count === 1 ? '' : 's').' removed.');
    }

    public function destroy(Request $request, DatabaseNotification $notification)
    {
        if ($notification->notifiable_id !== $request->user()->getAuthIdentifier()) {
            abort(403);
        }

        $notification->delete();

        return redirect()->back()->with('success', 'Notification removed.');
    }
}
