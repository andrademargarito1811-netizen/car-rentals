<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class FaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::orderBy('sort_order')->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('Admin/Faqs/Index', [
            'faqs' => $faqs,
        ]);
    }

    protected function getRedirect(Request $request): string
    {
        return $request->input('_redirect', 'admin.faqs.index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'required|string|max:100',
            'popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        Faq::create($validated);

        Cache::forget('shared.faqs');
        Cache::forget('chat.active_faqs');

        return redirect()->route($this->getRedirect($request))->with('success', 'FAQ created successfully.');
    }

    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'required|string|max:100',
            'popular' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $faq->update($validated);

        Cache::forget('shared.faqs');
        Cache::forget('chat.active_faqs');

        return redirect()->route($this->getRedirect($request))->with('success', 'FAQ updated successfully.');
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:faqs,id',
        ]);

        foreach ($request->ids as $index => $id) {
            Faq::where('id', $id)->update(['sort_order' => $index]);
        }

        Cache::forget('shared.faqs');
        Cache::forget('chat.active_faqs');

        return redirect()->back();
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        Cache::forget('shared.faqs');
        Cache::forget('chat.active_faqs');

        $redirect = request()->input('_redirect', 'admin.faqs.index');

        return redirect()->route($redirect)->with('success', 'FAQ deleted successfully.');
    }
}
