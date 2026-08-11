<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WhyBookItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class WhyBookController extends Controller
{
    public function index()
    {
        $items = WhyBookItem::orderBy('sort_order')->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Admin/WhyBook/Index', [
            'items' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon_svg' => 'nullable|string|max:500',
            'icon_path' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        WhyBookItem::create($validated);

        Cache::forget('shared.whyBookItems');

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Item created successfully.');
    }

    public function update(Request $request, WhyBookItem $whyBookItem)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'icon_svg' => 'nullable|string|max:500',
            'icon_path' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean',
        ]);

        $whyBookItem->update($validated);

        Cache::forget('shared.whyBookItems');

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Item updated successfully.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:why_book_items,id',
            'items.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->items as $item) {
            WhyBookItem::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        Cache::forget('shared.whyBookItems');

        return redirect()->back()->with('success', 'Items reordered.');
    }

    public function destroy(WhyBookItem $whyBookItem)
    {
        $whyBookItem->delete();

        Cache::forget('shared.whyBookItems');

        return redirect()->route('admin.hero-settings', ['page' => 'reservation'])->with('success', 'Item deleted successfully.');
    }
}
