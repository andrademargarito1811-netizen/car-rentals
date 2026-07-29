<?php

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Models\Conversation;
use App\Models\Faq;
use App\Models\FooterSetting;
use App\Models\HeroSetting;
use App\Models\ReservationSetting;
use App\Models\VehicleLocation;
use App\Models\WhyBookItem;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'faqs' => fn () => Faq::where('is_active', true)->orderBy('sort_order')->orderBy('created_at', 'desc')->get(),
            'footerSettings' => fn () => FooterSetting::first(),
            'heroSettings' => fn () => HeroSetting::with('images')->first(),
            'reservationSettings' => fn () => ReservationSetting::with('heroImages')->first(),
            'locations' => fn () => VehicleLocation::active()->orderBy('sort_order')->get(),
            'whyBookItems' => fn () => WhyBookItem::active()->get(),
            'unreadMessageCount' => fn () => ContactMessage::where('is_read', false)->count(),
            'chatUnreadCount' => fn () => Conversation::where('status', 'active')
                ->whereHas('messages', fn ($q) =>
                    $q->whereNull('read_at')->where('sender_type', '!=', 'admin')
                )->count(),
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
