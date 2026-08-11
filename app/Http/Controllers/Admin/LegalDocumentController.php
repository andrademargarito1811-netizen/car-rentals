<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\LegalDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LegalDocumentController extends Controller
{
    public function index()
    {
        $documents = LegalDocument::orderBy('type')->orderBy('id')->get();

        $website = $documents->where('type', 'website')->values();
        $invoice = $documents->where('type', 'invoice')->values();

        return Inertia::render('Admin/Agreements/Index', [
            'websiteDocuments' => $website,
            'invoiceDocuments' => $invoice,
        ]);
    }

    public function update(Request $request, LegalDocument $legalDocument)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'subtitle' => 'nullable|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $validated['updated_by'] = $request->user()?->id;
        $validated['version'] = $legalDocument->version + 1;

        $legalDocument->update($validated);

        return redirect()->route('admin.agreements.index')->with('success', "{$legalDocument->title} updated successfully.");
    }
}
