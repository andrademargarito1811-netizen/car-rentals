<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhyChooseUsItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WhyChooseUsController extends Controller
{
    public function index()
    {
        $items = WhyChooseUsItem::orderBy('sort_order')->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($items);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon_svg' => 'nullable|string|max:500',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        WhyChooseUsItem::create($validated);

        Cache::forget('shared.whyChooseUsItems');

        return redirect()->back()->with('success', 'Item created successfully.');
    }

    public function update(Request $request, WhyChooseUsItem $whyChooseUsItem)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon_svg' => 'nullable|string|max:500',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $whyChooseUsItem->update($validated);

        Cache::forget('shared.whyChooseUsItems');

        return redirect()->back()->with('success', 'Item updated successfully.');
    }

    public function destroy(WhyChooseUsItem $whyChooseUsItem)
    {
        $whyChooseUsItem->delete();

        Cache::forget('shared.whyChooseUsItems');

        return redirect()->back()->with('success', 'Item deleted successfully.');
    }
}
