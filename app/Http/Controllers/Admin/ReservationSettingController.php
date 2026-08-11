<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ReservationHeroImage;
use App\Models\ReservationSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class ReservationSettingController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'badge_text' => 'required|string|max:255',
            'badge_icon' => 'nullable|string|max:50',
            'badge_enabled' => 'boolean',
            'headline' => 'required|string|max:255',
            'headline_highlight' => 'required|string|max:255',
            'subtitle' => 'nullable|string',
            'stat_pills' => 'nullable|array',
            'stat_pills.*.icon' => 'required|string',
            'stat_pills.*.text' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $settings = ReservationSetting::first();

        if (!$settings) {
            $settings = ReservationSetting::create();
        }

        $settings->update($validated);

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Reservation settings updated successfully.');
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

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Hero image added.');
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

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Hero image updated.');
    }

    public function reorderImages(Request $request)
    {
        $request->validate([
            'images' => 'required|array',
            'images.*.id' => 'required|exists:reservation_hero_images,id',
            'images.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->images as $item) {
            ReservationHeroImage::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        Cache::forget('shared.reservationSettings');

        return redirect()->back()->with('success', 'Images reordered.');
    }

    public function deleteImage(ReservationHeroImage $reservationHeroImage)
    {
        if ($reservationHeroImage->image_path) {
            Storage::disk('public')->delete($reservationHeroImage->image_path);
        }

        $reservationHeroImage->delete();

        Cache::forget('shared.reservationSettings');

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Hero image removed.');
    }
}
