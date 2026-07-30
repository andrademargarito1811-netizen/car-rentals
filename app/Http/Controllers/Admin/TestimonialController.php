<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TestimonialController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'content' => 'required|string',
            'avatar_url' => 'nullable|string|max:500',
            'rating' => 'integer|min:1|max:5',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        Testimonial::create($validated);

        Cache::forget('shared.testimonials');

        return redirect()->back()->with('success', 'Testimonial created successfully.');
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'content' => 'required|string',
            'avatar_url' => 'nullable|string|max:500',
            'rating' => 'integer|min:1|max:5',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $testimonial->update($validated);

        Cache::forget('shared.testimonials');

        return redirect()->back()->with('success', 'Testimonial updated successfully.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:testimonials,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Testimonial::where('id', $id)->update(['sort_order' => $index]);
        }

        Cache::forget('shared.testimonials');

        return redirect()->back();
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        Cache::forget('shared.testimonials');

        return redirect()->back()->with('success', 'Testimonial deleted successfully.');
    }
}
