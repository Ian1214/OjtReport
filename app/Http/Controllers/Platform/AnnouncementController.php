<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\StorePlatformAnnouncementRequest;
use App\Models\PlatformAnnouncement;
use App\Models\User;
use App\Services\PlatformAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function store(StorePlatformAnnouncementRequest $request, PlatformAuditLogger $audit): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $announcement = PlatformAnnouncement::query()->create([
            ...$request->validated(),
            'created_by' => $actor->id,
            'published_at' => now(),
        ]);

        $audit->record($actor, 'announcement.published', "Published platform announcement: {$announcement->title}.", $request, $announcement);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Platform announcement published.']);

        return back();
    }

    public function destroy(Request $request, PlatformAnnouncement $platformAnnouncement, PlatformAuditLogger $audit): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        abort_unless($actor->isPlatformAdmin(), 403);
        $title = $platformAnnouncement->title;
        $audit->record($actor, 'announcement.withdrawn', "Withdrew platform announcement: {$title}.", $request, $platformAnnouncement);
        $platformAnnouncement->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Announcement withdrawn.']);

        return back();
    }
}
