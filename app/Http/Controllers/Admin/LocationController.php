<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LocationsPageSetting;
use App\Models\VehicleLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = VehicleLocation::orderBy('sort_order')->orderBy('location');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('location', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $locations = $query->paginate(20);

        $pageSettings = LocationsPageSetting::first();
        if (!$pageSettings) {
            $pageSettings = LocationsPageSetting::create();
        }

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
            'filters' => ['search' => $search],
            'pageSettings' => $pageSettings,
        ]);
    }

    public function updatePageSettings(Request $request)
    {
        $validated = $request->validate([
            'hero_badge' => 'required|string|max:255',
            'hero_title' => 'required|string|max:255',
            'hero_highlight' => 'required|string|max:255',
            'hero_description' => 'nullable|string',
            'hero_image' => 'nullable|image|max:5120',
            'hero_button_text' => 'required|string|max:255',
            'hero_phone_label' => 'required|string|max:255',
            'hero_phone_number' => 'required|string|max:100',
            'hero_active' => 'boolean',
            'cta_title' => 'required|string|max:255',
            'cta_description' => 'nullable|string',
            'cta_button_text' => 'required|string|max:255',
            'cta_button_url' => 'required|string|max:255',
            'cta_phone_label' => 'required|string|max:255',
            'cta_phone_number' => 'required|string|max:100',
            'cta_active' => 'boolean',
        ]);

        $settings = LocationsPageSetting::first();
        if (!$settings) {
            $settings = LocationsPageSetting::create();
        }

        if ($request->hasFile('hero_image')) {
            if ($settings->hero_image_path) {
                Storage::disk('public')->delete($settings->hero_image_path);
            }
            $validated['hero_image_path'] = $request->file('hero_image')->store('locations-page', 'public');
        }

        $settings->update($validated);

        Cache::forget('shared.locations');

        return redirect()->route('admin.locations.index')->with('success', 'Page settings updated successfully.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'location' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:100',
            'hours' => 'nullable|string|max:255',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*' => 'string|max:255',
            'image' => 'nullable|image|max:5120',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('locations', 'public');
        }

        VehicleLocation::create($validated);

        Cache::forget('shared.locations');

        return redirect()->route('admin.locations.index')->with('success', 'Location created successfully.');
    }

    public function update(Request $request, VehicleLocation $vehicleLocation)
    {
        $validated = $request->validate([
            'location' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:100',
            'hours' => 'nullable|string|max:255',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'features.*' => 'string|max:255',
            'image' => 'nullable|image|max:5120',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($request->hasFile('image')) {
            if ($vehicleLocation->image) {
                Storage::disk('public')->delete($vehicleLocation->image);
            }
            $validated['image'] = $request->file('image')->store('locations', 'public');
        }

        $vehicleLocation->update($validated);

        Cache::forget('shared.locations');

        return redirect()->route('admin.locations.index')->with('success', 'Location updated successfully.');
    }

    public function destroy(VehicleLocation $vehicleLocation)
    {
        if ($vehicleLocation->image) {
            Storage::disk('public')->delete($vehicleLocation->image);
        }

        $vehicleLocation->delete();

        Cache::forget('shared.locations');

        return redirect()->route('admin.locations.index')->with('success', 'Location deleted successfully.');
    }
}
