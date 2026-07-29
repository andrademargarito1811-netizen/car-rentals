<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReservationHeroImage;
use App\Models\ReservationSetting;
use App\Models\WhyBookItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReservationSettingController extends Controller
{
    public function index()
    {
        $settings = ReservationSetting::with('heroImages')->first();

        if (!$settings) {
            $settings = ReservationSetting::create([
                'badge_text' => 'Palau Exclusive',
                'headline' => 'Reserve Your',
                'headline_highlight' => 'Ride',
                'subtitle' => 'Complete the form below to secure your perfect vehicle. Palau-exclusive rentals for a truly unique experience.',
            ]);
        }

        $whyBookItems = WhyBookItem::orderBy('sort_order')->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Admin/HeroSettings/Reservation_Settings', [
            'settings' => $settings,
            'whyBookItems' => $whyBookItems,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'badge_text' => 'required|string|max:255',
            'headline' => 'required|string|max:255',
            'headline_highlight' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'stat_pills' => 'nullable|array',
            'stat_pills.*.icon' => 'required|string',
            'stat_pills.*.text' => 'required|string',
            'is_active' => 'boolean',
            'booking_terms' => 'nullable|string',
        ]);

        $settings = ReservationSetting::first();

        if (!$settings) {
            $settings = ReservationSetting::create();
        }

        $settings->update($validated);

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.reservation-settings')->with('success', 'Reservation settings updated successfully.');
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'reservation_setting_id' => 'required|exists:reservation_settings,id',
            'image' => 'required|image|max:5120',
            'alt_text' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:255',
        ]);

        $imagePath = $request->file('image')->store('reservation-hero', 'public');

        $maxOrder = ReservationHeroImage::where('reservation_setting_id', $request->reservation_setting_id)->max('sort_order') ?? 0;

        ReservationHeroImage::create([
            'reservation_setting_id' => $request->reservation_setting_id,
            'image_path' => $imagePath,
            'alt_text' => $request->alt_text,
            'caption' => $request->caption,
            'sort_order' => $maxOrder + 1,
        ]);

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.reservation-settings')->with('success', 'Hero image added.');
    }

    public function updateImage(Request $request, ReservationHeroImage $reservationHeroImage)
    {
        $validated = $request->validate([
            'alt_text' => 'nullable|string|max:255',
            'caption' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer|min:0',
            'image' => 'nullable|image|max:5120',
        ]);

        if ($request->hasFile('image')) {
            if ($reservationHeroImage->image_path) {
                Storage::disk('public')->delete($reservationHeroImage->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('reservation-hero', 'public');
        }

        $reservationHeroImage->update($validated);

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.reservation-settings')->with('success', 'Hero image updated.');
    }

    public function deleteImage(ReservationHeroImage $reservationHeroImage)
    {
        if ($reservationHeroImage->image_path) {
            Storage::disk('public')->delete($reservationHeroImage->image_path);
        }

        $reservationHeroImage->delete();

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.reservation-settings')->with('success', 'Hero image removed.');
    }
}
