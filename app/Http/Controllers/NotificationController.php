<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $notifications = $user->notifications()->latest()->paginate(20);
        $visibleUnreadIds = $notifications->getCollection()
            ->whereNull('read_at')
            ->pluck('id');
        $visibleUnreadLookup = array_fill_keys($visibleUnreadIds->all(), true);
        $viewedAt = now();

        if ($visibleUnreadIds->isNotEmpty()) {
            $user->unreadNotifications()
                ->whereIn('id', $visibleUnreadIds)
                ->update(['read_at' => $viewedAt]);
        }

        return Inertia::render('notifications/index', [
            'unreadCount' => $user->unreadNotifications()->count(),
            'notifications' => $notifications->through(function ($notification) use ($visibleUnreadLookup, $viewedAt): array {
                $wasUnread = isset($visibleUnreadLookup[$notification->id]);

                return [
                    'id' => $notification->id,
                    'data' => $notification->data,
                    'wasUnread' => $wasUnread,
                    'readAt' => ($wasUnread ? $viewedAt : $notification->read_at)?->toIso8601String(),
                    'createdAt' => $notification->created_at?->toIso8601String(),
                ];
            }),
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $databaseNotification = $user->notifications()->whereKey($notification)->firstOrFail();

        $databaseNotification->markAsRead();

        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->unreadNotifications()->update(['read_at' => now()]);

        return back();
    }
}
