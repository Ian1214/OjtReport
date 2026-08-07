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

        return Inertia::render('notifications/index', [
            'unreadCount' => $user->unreadNotifications()->count(),
            'notifications' => $notifications->through(fn ($notification): array => [
                'id' => $notification->id,
                'data' => $notification->data,
                'readAt' => $notification->read_at?->toIso8601String(),
                'createdAt' => $notification->created_at?->toIso8601String(),
            ]),
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
