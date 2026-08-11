<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class FooterSettingController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'brand_name' => 'required|string|max:255',
            'brand_tagline' => 'nullable|string|max:255',
            'brand_description' => 'nullable|string',
            'logo' => 'nullable|image|max:2048',
            'newsletter_heading' => 'required|string|max:255',
            'newsletter_description' => 'nullable|string',
            'newsletter_placeholder' => 'required|string|max:255',
            'newsletter_active' => 'boolean',
            'contact_email' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:255',
            'contact_hours' => 'required|string|max:255',
            'contact_address' => 'required|string|max:255',
            'copyright_text' => 'required|string|max:255',
            'quick_links' => 'nullable|array',
            'quick_links.*.label' => 'required|string|max:255',
            'quick_links.*.url' => 'required|string|max:255',
            'legal_links' => 'nullable|array',
            'legal_links.*.label' => 'required|string|max:255',
            'legal_links.*.url' => 'required|string|max:255',
            'social_links' => 'nullable|array',
            'social_links.*.platform' => 'required|string|max:255',
            'social_links.*.label' => 'required|string|max:255',
            'social_links.*.url' => 'required|string|max:255',
            'is_active' => 'boolean',
        ]);

        $settings = FooterSetting::first();

        if (!$settings) {
            $settings = FooterSetting::create();
        }

        if ($request->hasFile('logo')) {
            if ($settings->logo_path && $settings->logo_path !== '/img/company_logo/company-logos-01.png') {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('footer', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($settings->logo_path && $settings->logo_path !== '/img/company_logo/company-logos-01.png') {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = '/img/company_logo/company-logos-01.png';
        }

        $settings->update($validated);

        Cache::forget('shared.footerSettings');

        return redirect()->route('admin.hero-settings', ['page' => 'brand'])->with('success', 'Brand settings updated successfully.');
    }
}
