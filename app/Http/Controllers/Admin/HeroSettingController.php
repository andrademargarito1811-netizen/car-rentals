<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroImage;
use App\Models\HeroSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HeroSettingController extends Controller
{
    public function index()
    {
        $settings = HeroSetting::with('images')->first();

        if (!$settings) {
            $settings = HeroSetting::create([
                'badge_text' => 'Premium Car Rental Service',
                'headline' => 'Find Your',
                'headline_highlight' => 'Perfect Ride',
                'tagline' => 'Drive Your Dreams, One Mile at a Time',
                'description' => 'Browse our fleet of premium vehicles and hit the road with confidence',
            ]);
        }

        return Inertia::render('Admin/HeroSettings/Index', [
            'settings' => $settings,
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

        return redirect()->route('admin.hero-settings')->with('success', 'Hero settings updated successfully.');
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
