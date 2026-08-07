<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDirectMessageRequest;
use App\Http\Requests\UpdateDirectMessageRequest;
use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class DirectMessageController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        abort_if($user->isCompanyAdmin(), 403);

        return Inertia::render('messages/index', [
            'contacts' => $this->contactsFor($user),
            'participant' => null,
            'messages' => [],
        ]);
    }

    public function show(Request $request, User $participant): Response
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless($this->canMessage($user, $participant), 404);

        $messages = DirectMessage::query()
            ->where(function ($query) use ($user, $participant): void {
                $query->where('sender_id', $user->id)
                    ->where('recipient_id', $participant->id);
            })
            ->orWhere(function ($query) use ($user, $participant): void {
                $query->where('sender_id', $participant->id)
                    ->where('recipient_id', $user->id);
            })
            ->latest('id')
            ->limit(200)
            ->get()
            ->reverse()
            ->values();

        DirectMessage::query()
            ->where('sender_id', $participant->id)
            ->where('recipient_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Inertia::render('messages/index', [
            'contacts' => $this->contactsFor($user),
            'participant' => [
                'id' => $participant->id,
                'name' => $participant->name,
                'role' => $participant->role,
                'position' => $participant->position,
                'department' => $participant->department,
            ],
            'messages' => $messages->map(fn (DirectMessage $message): array => [
                'id' => $message->id,
                'body' => $message->body,
                'imageUrl' => $message->image_path === null
                    ? null
                    : route('messages.image', $message, absolute: false),
                'isMine' => $message->sender_id === $user->id,
                'canEdit' => $message->sender_id === $user->id
                    && $message->created_at?->greaterThanOrEqualTo(now()->subMinutes(10)),
                'editedAt' => $message->edited_at?->toIso8601String(),
                'sentAt' => $message->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(StoreDirectMessageRequest $request, User $recipient): RedirectResponse
    {
        /** @var User $sender */
        $sender = $request->user();

        abort_unless($this->canMessage($sender, $recipient), 404);

        $imagePath = $request->file('image')?->store('chat-images', 'local');

        abort_if($imagePath === false, 500, 'The image could not be stored.');

        DirectMessage::query()->create([
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'body' => $request->string('body')->trim()->toString() ?: null,
            'image_path' => $imagePath,
        ]);

        return to_route('messages.show', $recipient);
    }

    public function update(UpdateDirectMessageRequest $request, DirectMessage $directMessage): RedirectResponse
    {
        $directMessage->update([
            'body' => $request->string('body')->trim()->toString() ?: null,
            'edited_at' => now(),
        ]);

        return back();
    }

    public function destroy(Request $request, DirectMessage $directMessage): RedirectResponse
    {
        abort_unless($directMessage->sender_id === $request->user()?->id, 404);

        if ($directMessage->image_path !== null) {
            Storage::disk('local')->delete($directMessage->image_path);
        }

        $directMessage->delete();

        return back();
    }

    public function image(Request $request, DirectMessage $directMessage): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();
        $otherUserId = $directMessage->sender_id === $user->id
            ? $directMessage->recipient_id
            : $directMessage->sender_id;
        $otherUser = User::query()->findOrFail($otherUserId);

        abort_unless(
            ($directMessage->sender_id === $user->id || $directMessage->recipient_id === $user->id)
                && $this->canMessage($user, $otherUser)
                && $directMessage->image_path !== null
                && Storage::disk('local')->exists($directMessage->image_path),
            404,
        );

        return Storage::disk('local')->response($directMessage->image_path);
    }

    /**
     * @return array<int, array{id: int, name: string, role: string, position: string|null, department: string|null}>
     */
    private function contactsFor(User $user): array
    {
        $contacts = $user->isSupervisor()
            ? $user->assignedOjts()->orderBy('name')->get()
            : collect([$user->assignedSupervisor])->filter();

        return $contacts
            ->map(fn (User $contact): array => [
                'id' => $contact->id,
                'name' => $contact->name,
                'role' => $contact->role,
                'position' => $contact->position,
                'department' => $contact->department,
            ])
            ->values()
            ->all();
    }

    private function canMessage(User $sender, User $recipient): bool
    {
        return ($sender->isSupervisor()
                && $recipient->role === 'ojt'
                && $recipient->supervisor_id === $sender->id)
            || ($sender->role === 'ojt'
                && $recipient->isSupervisor()
                && $sender->supervisor_id === $recipient->id);
    }
}
