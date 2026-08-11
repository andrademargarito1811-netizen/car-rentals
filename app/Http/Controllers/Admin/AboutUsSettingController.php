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
            'hero_image' => 'nullable|image|max:10240',
            'story_heading' => 'required|string|max:255',
            'story_content' => 'nullable|string',
            'story_image' => 'nullable|image|max:10240',
            'mission_text' => 'nullable|string',
            'vision_text' => 'nullable|string',
            'stats' => 'nullable|array',
            'stats.*.value' => 'required|string|max:255',
            'stats.*.label' => 'required|string|max:255',
            'values' => 'nullable|array',
            'values.*.icon' => 'required|string',
            'values.*.title' => 'required|string|max:255',
            'values.*.description' => 'nullable|string',
            'values.*.color' => 'required|string',
            'team_members' => 'nullable|array',
            'team_members.*.name' => 'required|string|max:255',
            'team_members.*.role' => 'nullable|string|max:255',
            'team_members.*.image' => 'nullable|image|max:10240',
            'team_members.*.image_path' => 'nullable|string|max:255',
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

        if ($request->hasFile('story_image')) {
            if ($settings->story_image_path) {
                Storage::disk('public')->delete($settings->story_image_path);
            }
            $validated['story_image_path'] = $request->file('story_image')->store('about-us-page/story', 'public');
        }

        if (isset($validated['team_members']) && is_array($validated['team_members'])) {
            foreach ($validated['team_members'] as $i => $member) {
                if ($request->hasFile("team_members.{$i}.image")) {
                    $member['image_path'] = $request->file("team_members.{$i}.image")->store('about-us-page/team', 'public');
                } else {
                    $member['image_path'] = $member['image_path'] ?? null;
                }
                unset($member['image']);
                $validated['team_members'][$i] = $member;
            }
        }

        $settings->update($validated);

        Cache::forget('shared.aboutUsSettings');

        return redirect()->route('admin.hero-settings')->with('success', 'About Us page settings updated successfully.');
    }
}
