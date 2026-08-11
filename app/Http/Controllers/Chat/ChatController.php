<?php

namespace App\Http\Controllers\Chat;

use App\Events\AdminMentioned;
use App\Events\MessagesRead;
use App\Events\NewMessage;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Faq;
use App\Models\Message;
use App\Models\User;
use App\Services\ChatAutoReplyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChatController extends Controller
{
    public function __construct(
        protected ChatAutoReplyService $autoReplyService
    ) {}

    public function index()
    {
        $user = request()->user();
        if (! $user || ! $user->isAdmin()) {
            abort(403);
        }

        $userId = $user->id;

        $conversations = Conversation::with([
            'user:id,name,email',
            'admin:id,name',
            'latestMessage' => fn ($q) => $q->where('is_internal', false),
            'messages:id,conversation_id,mentioned_admin_ids',
        ])
            ->withCount(['messages as unread_count' => fn ($q) => $q->whereNull('read_at')->where('sender_type', '!=', 'admin'),
            ])
            ->withCount(['messages as notes_count' => fn ($q) => $q->where('is_internal', true),
            ])
            ->where('status', 'active')
            ->orderBy('updated_at', 'desc')
            ->paginate(20);

        if ($userId) {
            $conversations->getCollection()->each(function ($conversation) use ($userId) {
                $conversation->has_mention = $conversation->messages
                    ->filter(fn ($m) => ! empty($m->mentioned_admin_ids) && in_array($userId, $m->mentioned_admin_ids))
                    ->count();
                $conversation->unsetRelation('messages');
            });
        }

        return Inertia::render('Admin/Chats/Index', [
            'conversations' => $conversations,
        ]);
    }

    public function show(Conversation $conversation)
    {
        $conversation->load([
            'user:id,name,email',
            'admin:id,name',
            'messages.sender:id,name',
        ]);

        return Inertia::render('Admin/Chats/Show', [
            'conversation' => $conversation,
        ]);
    }

    public function search(Request $request)
    {
        if (! $request->user() || ! $request->user()->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $q = $request->input('q', '');

        $query = Conversation::with([
            'user:id,name,email',
            'admin:id,name',
            'latestMessage' => fn ($q) => $q->where('is_internal', false),
        ])
            ->withCount(['messages as unread_count' => fn ($q) => $q->whereNull('read_at')->where('sender_type', '!=', 'admin'),
            ])
            ->withCount(['messages as notes_count' => fn ($q) => $q->where('is_internal', true),
            ])
            ->where('status', 'active');

        if (trim($q)) {
            $search = '%'.trim($q).'%';
            $query->where(function ($query) use ($search) {
                $query->whereHas('user', fn ($q) => $q->where('name', 'like', $search)->orWhere('email', 'like', $search))
                    ->orWhere('guest_token', 'like', $search)
                    ->orWhere('guest_name', 'like', $search)
                    ->orWhere('guest_email', 'like', $search)
                    ->orWhereHas('messages', fn ($q) => $q->where('body', 'like', $search));
            });
        }

        $query->orderBy('updated_at', 'desc');

        return response()->json(['data' => $query->get()]);
    }

    public function storeGuestIdentity(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'guest_token' => 'required|string|max:100',
        ]);

        $conversation = Conversation::firstOrCreate(
            ['guest_token' => $validated['guest_token'], 'status' => 'active'],
            ['status' => 'active'],
        );

        $conversation->update([
            'guest_name' => $validated['name'],
            'guest_email' => $validated['email'],
        ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'guest_name' => $conversation->guest_name,
            'guest_email' => $conversation->guest_email,
        ]);
    }

    public function assign(Conversation $conversation)
    {
        $user = request()->user();
        if (! $user || ! $user->isAdmin()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $conversation->update(['admin_id' => $user->id]);

        try {
            broadcast(new UserTyping($conversation, false, ''));
        } catch (\Exception $e) {
            logger()->error('Assign typing broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'admin_id' => $user->id,
            'admin_name' => $user->name,
        ]);
    }

    public function faqs(Request $request)
    {
        $faqs = Faq::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'question', 'answer', 'category']);

        return response()->json(['data' => $faqs]);
    }

    public function faqAnswer(Request $request)
    {
        $validated = $request->validate([
            'faq_id' => 'required|exists:faqs,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'guest_token' => 'nullable|string|max:100',
        ]);

        $user = $request->user();
        $faq = Faq::findOrFail($validated['faq_id']);

        if ($request->input('conversation_id')) {
            $conversation = Conversation::findOrFail($validated['conversation_id']);
            if ($user && ! $user->isAdmin() && $conversation->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            if (! $user && $conversation->guest_token !== ($validated['guest_token'] ?? null)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } else {
            if ($user) {
                $conversation = Conversation::firstOrCreate(
                    ['user_id' => $user->id, 'status' => 'active'],
                    ['status' => 'active'],
                );
            } elseif ($validated['guest_token']) {
                $conversation = Conversation::firstOrCreate(
                    ['guest_token' => $validated['guest_token'], 'status' => 'active'],
                    ['status' => 'active'],
                );
            } else {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
        }

        $guestMsg = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user?->id,
            'sender_type' => $user ? 'user' : 'guest',
            'body' => $faq->question,
        ]);

        $systemMsg = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => null,
            'sender_type' => 'system',
            'body' => $faq->answer,
        ]);

        $conversation->touch();

        try {
            broadcast(new NewMessage($guestMsg));
        } catch (\Exception $e) {
            logger()->error('FAQ answer guest msg broadcast failed', ['error' => $e->getMessage()]);
        }

        try {
            broadcast(new NewMessage($systemMsg));
        } catch (\Exception $e) {
            logger()->error('FAQ answer system msg broadcast failed', ['error' => $e->getMessage()]);
        }

        $guestMsg->load('sender:id,name');
        $systemMsg->load('sender:id,name');

        return response()->json([
            'guest_message' => $guestMsg,
            'system_message' => $systemMsg,
            'conversation_id' => $conversation->id,
        ], 201);
    }

    public function conversations(Request $request)
    {
        if (! $request->user()) {
            $this->autoReplyService->pruneStaleGuestConversations();
        }

        $query = Conversation::with([
            'user:id,name',
        ])
            ->where('status', 'active')
            ->orderBy('updated_at', 'desc');

        if ($request->user()) {
            $query->where('user_id', $request->user()->id);
        } elseif ($request->guest_token) {
            $query->where('guest_token', $request->guest_token);
        } else {
            return response()->json(['data' => []]);
        }

        $conversations = $query->get();

        if (! $request->user() || ! $request->user()->isAdmin()) {
            $conversations->load(['latestMessage' => function ($q) {
                $q->where('is_internal', false);
            }]);
        } else {
            $conversations->load('latestMessage');
        }

        return response()->json(['data' => $conversations]);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $user = $request->user();

        if ($user && ! $user->isAdmin() && $conversation->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (! $user && $request->guest_token !== $conversation->guest_token) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $messagesQuery = $conversation->messages()->with('sender:id,name');

        if (! $user || ! $user->isAdmin()) {
            $messagesQuery->where('is_internal', false);
        }

        return response()->json(['data' => $messagesQuery->limit(100)->get()]);
    }

    public function admins(Request $request)
    {
        $admins = User::where('role', 'admin')->get(['id', 'name', 'last_active_at']);
        $admins->each(function ($admin) {
            $admin->is_online = $admin->last_active_at && $admin->last_active_at->gt(now()->subMinutes(5));
        });

        return response()->json(['data' => $admins]);
    }

    public function heartbeat(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update(['last_active_at' => now()]);
        }

        return response()->json(['success' => true]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'nullable|exists:conversations,id',
            'body' => 'required|string|max:5000',
            'guest_token' => 'nullable|string|max:100',
            'is_internal' => 'nullable|boolean',
        ]);

        $user = $request->user();

        if ($request->input('conversation_id')) {
            $conversation = Conversation::findOrFail($validated['conversation_id']);

            if ($user && ! $user->isAdmin() && $conversation->user_id !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
            if (! $user && $conversation->guest_token !== ($validated['guest_token'] ?? null)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } else {
            if ($user) {
                $conversation = Conversation::firstOrCreate(
                    ['user_id' => $user->id, 'status' => 'active'],
                    ['status' => 'active'],
                );
            } elseif ($validated['guest_token']) {
                $conversation = Conversation::firstOrCreate(
                    ['guest_token' => $validated['guest_token'], 'status' => 'active'],
                    ['status' => 'active'],
                );
            } else {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
        }

        if ($user && $user->isAdmin()) {
            $conversation->admin_id = $user->id;
            $conversation->save();
        }

        $message = Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user?->id,
            'sender_type' => $user?->isAdmin() ? 'admin' : ($user ? 'user' : 'guest'),
            'body' => $validated['body'],
            'is_internal' => $user?->isAdmin() ? ($validated['is_internal'] ?? false) : false,
        ]);

        $mentionedIds = [];
        if ($user && $user->isAdmin()) {
            preg_match_all('/@([\w\s-]+)/', $validated['body'], $matches);
            if (! empty($matches[1])) {
                $names = array_unique(array_filter(array_map('trim', $matches[1])));
                if (! empty($names)) {
                    $mentionedIds = User::whereIn('name', $names)
                        ->where('role', 'admin')
                        ->where('id', '!=', $user->id)
                        ->pluck('id')
                        ->toArray();
                }
            }
        }
        if (! empty($mentionedIds)) {
            $message->update(['mentioned_admin_ids' => $mentionedIds]);
            try {
                broadcast(new AdminMentioned($message, $mentionedIds));
            } catch (\Exception $e) {
                logger()->error('Admin mention broadcast failed', [
                    'error' => $e->getMessage(),
                    'conversation_id' => $conversation->id,
                ]);
            }
        }

        $conversation->touch();

        try {
            broadcast(new NewMessage($message));
        } catch (\Exception $e) {
            logger()->error('Chat broadcast failed', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversation->id,
            ]);
        }

        $message->load('sender:id,name');

        $response = [
            'message' => $message,
            'conversation_id' => $conversation->id,
        ];

        if (! $user || ! $user->isAdmin()) {
            $contactReply = $this->autoReplyService->handleContactInfo($conversation, $validated['body']);
            if ($contactReply) {
                $response['auto_reply'] = $contactReply;
            }

            $autoReply = $this->autoReplyService->createAutoReply($conversation, $validated['body']);
            if ($autoReply) {
                $response['auto_reply'] = $autoReply;
            }
        } elseif ($message->is_internal) {
            $conversation->touch();
        }

        return response()->json($response, 201);
    }

    public function markAsRead(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'guest_token' => 'nullable|string|max:100',
        ]);

        $conversation = Conversation::findOrFail($validated['conversation_id']);
        $user = $request->user();

        if (! $user && $conversation->guest_token !== ($validated['guest_token'] ?? null)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        Message::where('conversation_id', $conversation->id)
            ->whereNull('read_at')
            ->when($user, function ($q) use ($user) {
                $q->where(function ($q) use ($user) {
                    $q->whereNull('sender_id')->orWhere('sender_id', '!=', $user->id);
                });
            })
            ->when(! $user, function ($q) {
                $q->where('sender_type', '!=', 'guest');
            })
            ->update(['read_at' => now()]);

        try {
            broadcast(new MessagesRead(
                $conversation,
                $user?->id ?? 0,
                $user?->isAdmin() ? 'admin' : ($user ? 'user' : 'guest'),
            ));
        } catch (\Exception $e) {
            logger()->error('MessagesRead broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true]);
    }

    public function typing(Request $request)
    {
        $validated = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'typing' => 'required|boolean',
            'guest_token' => 'nullable|string|max:100',
        ]);

        $conversation = Conversation::findOrFail($validated['conversation_id']);
        $user = $request->user();

        if (! $user && $conversation->guest_token !== ($validated['guest_token'] ?? null)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            broadcast(new UserTyping($conversation, $validated['typing'], $user?->name));
        } catch (\Exception $e) {
            logger()->error('UserTyping broadcast failed', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true]);
    }
}
