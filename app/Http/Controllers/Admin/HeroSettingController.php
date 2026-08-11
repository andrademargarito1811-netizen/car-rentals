<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AboutUsSetting;
use App\Models\Faq;
use App\Models\FleetPageSetting;
use App\Models\FooterSetting;
use App\Models\HeroImage;
use App\Models\HeroSetting;
use App\Models\LocationsPageSetting;
use App\Models\ReservationSetting;
use App\Models\Testimonial;
use App\Models\WhyChooseUsItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HeroSettingController extends Controller
{
    public function index(Request $request)
    {
        $settings = HeroSetting::with('images')->first();

        if (!$settings) {
            $settings = HeroSetting::create([
                'badge_text' => 'Premium Car Rental Service',
                'headline' => 'Find Your',
                'headline_highlight' => 'Perfect Ride',
                'tagline' => 'Drive Your Dreams, One Mile at a Time',
                'description' => 'Browse our fleet of premium vehicles and hit the road with confidence',
                'why_choose_us_heading' => 'Built for a Better Rental Experience',
                'why_choose_us_subheading' => 'We go the extra mile to make every rental smooth, transparent, and enjoyable from start to finish.',
            ]);
        }

        // Fleet page settings
        $fleetSettings = FleetPageSetting::first();
        if (!$fleetSettings) {
            $fleetSettings = FleetPageSetting::create();
        }

        // Reservation settings
        $reservationSettings = ReservationSetting::with('heroImages')->first();
        if (!$reservationSettings) {
            $reservationSettings = ReservationSetting::create([
                'badge_text' => 'Palau Exclusive',
                'headline' => 'Reserve Your',
                'headline_highlight' => 'Ride',
                'subtitle' => 'Complete the form below to secure your perfect vehicle. Palau-exclusive rentals for a truly unique experience.',
            ]);
        }

        // Locations page settings
        $locationsPageSettings = LocationsPageSetting::first();
        if (!$locationsPageSettings) {
            $locationsPageSettings = LocationsPageSetting::create();
        }

        // About Us settings
        $aboutUsSettings = AboutUsSetting::first();
        if (!$aboutUsSettings) {
            $aboutUsSettings = AboutUsSetting::create();
        }

        // Brand (footer) settings
        $footerSettings = FooterSetting::first();
        if (!$footerSettings) {
            $footerSettings = FooterSetting::create();
        }

        $whyChooseUsItems = WhyChooseUsItem::orderBy('sort_order')->get();
        $faqItems = Faq::orderBy('sort_order')->get();
        $testimonialItems = Testimonial::orderBy('sort_order')->get();
        $whyBookItems = \App\Models\WhyBookItem::orderBy('sort_order')->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/HeroSettings/Index', [
            'homeSettings' => $settings,
            'whyChooseUsItems' => $whyChooseUsItems,
            'faqItems' => $faqItems,
            'testimonialItems' => $testimonialItems,
            'fleetSettings' => $fleetSettings,
            'reservationSettings' => $reservationSettings,
            'locationsPageSettings' => $locationsPageSettings,
            'aboutUsSettings' => $aboutUsSettings,
            'footerSettings' => $footerSettings,
            'whyBookItems' => $whyBookItems,
            'page' => $request->query('page', 'home'),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'badge_text' => 'required|string|max:255',
            'badge_enabled' => 'boolean',
            'badge_icon' => 'required|in:tag,percent,dollar,star,shield,location',
            'booking_badge_text' => 'required|string|max:255',
            'booking_badge_enabled' => 'boolean',
            'booking_badge_icon' => 'required|in:tag,percent,dollar,star,shield,location',
            'headline' => 'required|string|max:255',
            'headline_highlight' => 'required|string|max:255',
            'tagline' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
            'fleet_image' => 'nullable|image|max:5120',
            'is_active' => 'boolean',
            'why_choose_us_heading' => 'required|string|max:255',
            'why_choose_us_subheading' => 'required|string|max:500',
        ]);

        $settings = HeroSetting::first();

        if (!$settings) {
            $settings = HeroSetting::create();
        }

        if ($request->hasFile('image')) {
            if ($settings->image_path) {
                Storage::disk('public')->delete($settings->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('hero', 'public');
        }

        if ($request->hasFile('fleet_image')) {
            if ($settings->fleet_image_path) {
                Storage::disk('public')->delete($settings->fleet_image_path);
            }
            $validated['fleet_image_path'] = $request->file('fleet_image')->store('hero', 'public');
        }

        $settings->update($validated);

        Cache::forget('shared.heroSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Home page settings updated successfully.');
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'hero_setting_id' => 'required|exists:hero_settings,id',
            'image' => 'required|image|max:5120',
            'tagline' => 'nullable|string|max:255',
            'alt_text' => 'nullable|string|max:255',
        ]);

        $imagePath = $request->file('image')->store('hero/carousel', 'public');

        $maxOrder = HeroImage::where('hero_setting_id', $request->hero_setting_id)->max('sort_order') ?? 0;

        HeroImage::create([
            'hero_setting_id' => $request->hero_setting_id,
            'image_path' => $imagePath,
            'tagline' => $request->tagline,
            'alt_text' => $request->alt_text,
            'sort_order' => $maxOrder + 1,
        ]);

        Cache::forget('shared.heroSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Carousel image added.');
    }

    public function updateImage(Request $request, HeroImage $heroImage)
    {
        $validated = $request->validate([
            'tagline' => 'nullable|string|max:255',
            'alt_text' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($heroImage->image_path) {
                Storage::disk('public')->delete($heroImage->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('hero/carousel', 'public');
        }

        $heroImage->update($validated);

        Cache::forget('shared.heroSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Carousel image updated.');
    }

    public function reorderImages(Request $request)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*.id' => 'required|exists:hero_images,id',
            'images.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->images as $item) {
            HeroImage::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        Cache::forget('shared.heroSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Image order updated.');
    }

    public function deleteImage(HeroImage $heroImage)
    {
        if ($heroImage->image_path) {
            Storage::disk('public')->delete($heroImage->image_path);
        }

        $heroImage->delete();

        Cache::forget('shared.heroSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Carousel image removed.');
    }
}
