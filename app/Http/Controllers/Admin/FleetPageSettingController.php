<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FleetPageSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class FleetPageSettingController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_badge' => 'required|string|max:255',
            'hero_title' => 'required|string|max:255',
            'hero_highlight' => 'required|string|max:255',
            'hero_description' => 'nullable|string',
            'hero_image' => 'nullable|image|max:5120',
            'section_heading' => 'required|string|max:255',
            'section_subheading' => 'required|string|max:500',
            'is_active' => 'boolean',
        ]);

        $settings = FleetPageSetting::first();

        if (!$settings) {
            $settings = FleetPageSetting::create();
        }

        if ($request->hasFile('hero_image')) {
            if ($settings->hero_image_path) {
                Storage::disk('public')->delete($settings->hero_image_path);
            }
            $validated['hero_image_path'] = $request->file('hero_image')->store('fleet-page', 'public');
        }

        $settings->update($validated);

        Cache::forget('shared.fleetSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'Fleet page settings updated successfully.');
    }
}
