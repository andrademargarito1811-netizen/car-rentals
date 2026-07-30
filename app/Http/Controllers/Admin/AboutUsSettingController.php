<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AboutUsSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AboutUsSettingController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'hero_badge' => 'required|string|max:255',
            'hero_title' => 'required|string|max:255',
            'hero_highlight' => 'required|string|max:255',
            'hero_description' => 'nullable|string',
            'hero_image' => 'nullable|image|max:5120',
            'story_heading' => 'required|string|max:255',
            'story_content' => 'nullable|string',
            'mission_text' => 'nullable|string',
            'vision_text' => 'nullable|string',
            'stats' => 'nullable|array',
            'stats.*.value' => 'required|string|max:255',
            'stats.*.label' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $settings = AboutUsSetting::first();

        if (!$settings) {
            $settings = AboutUsSetting::create();
        }

        if ($request->hasFile('hero_image')) {
            if ($settings->hero_image_path) {
                Storage::disk('public')->delete($settings->hero_image_path);
            }
            $validated['hero_image_path'] = $request->file('hero_image')->store('about-us-page', 'public');
        }

        $settings->update($validated);

        Cache::forget('shared.aboutUsSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'About Us page settings updated successfully.');
    }
}
