<?php

namespace App\Http\Middleware;

use App\Models\ContactMessage;
use App\Models\Conversation;
use App\Models\AboutUsSetting;
use App\Models\Faq;
use App\Models\FooterSetting;
use App\Models\HeroSetting;
use App\Models\InvoiceSetting;
use App\Models\ReservationSetting;
use App\Models\VehicleLocation;
use App\Models\WhyBookItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * TTL (seconds) for cached shared settings that change rarely.
     */
    public const CACHE_TTL = 300;

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    private function remember(string $key, callable $callback): mixed
    {
        return Cache::remember($key, self::CACHE_TTL, $callback);
    }

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
            'faqs' => fn () => $this->remember('shared.faqs', fn () => Faq::where('is_active', true)->orderBy('sort_order')->orderBy('created_at', 'desc')->get()->toArray()),
            'aboutUsSettings' => fn () => $this->remember('shared.aboutUsSettings', fn () => AboutUsSetting::first()?->toArray()),
            'footerSettings' => fn () => $this->remember('shared.footerSettings', fn () => FooterSetting::first()?->toArray()),
            'invoiceSettings' => fn () => $this->remember('shared.invoiceSettings', fn () => InvoiceSetting::first()?->toArray()),
            'heroSettings' => fn () => $this->remember('shared.heroSettings', fn () => HeroSetting::with('images')->first()?->toArray()),
            'reservationSettings' => fn () => $this->remember('shared.reservationSettings', fn () => ReservationSetting::with('heroImages')->first()?->toArray()),
            'locations' => fn () => $this->remember('shared.locations', fn () => VehicleLocation::active()->orderBy('sort_order')->get()->toArray()),
            'whyBookItems' => fn () => $this->remember('shared.whyBookItems', fn () => WhyBookItem::active()->get()->toArray()),
            'unreadMessageCount' => fn () => $request->user()?->isAdmin() ? ContactMessage::where('is_read', false)->count() : null,
            'chatUnreadCount' => fn () => $request->user()?->isAdmin()
                ? Conversation::where('status', 'active')
                    ->whereHas('messages', fn ($q) =>
                        $q->whereNull('read_at')->where('sender_type', '!=', 'admin')
                    )->count()
                : null,
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}
