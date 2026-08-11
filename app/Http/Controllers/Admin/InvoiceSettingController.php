<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InvoiceSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class InvoiceSettingController extends Controller
{
    public function index()
    {
        $settings = InvoiceSetting::first();

        if (!$settings) {
            $settings = InvoiceSetting::create();
        }

        return Inertia::render('Admin/InvoiceSettings/Index', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'company_legal_name' => 'required|string|max:255',
            'phone' => 'required|string|max:255',
            'emergency_phone' => 'nullable|string|max:255',
            'fax' => 'nullable|string|max:255',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048',
            'is_active' => 'boolean',
        ]);

        $settings = InvoiceSetting::first();

        if (!$settings) {
            $settings = InvoiceSetting::create();
        }

        if ($request->hasFile('logo')) {
            if ($settings->logo_path && $settings->logo_path !== '/img/company_logo/company-logos-01.png') {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('invoice', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($settings->logo_path && $settings->logo_path !== '/img/company_logo/company-logos-01.png') {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = '/img/company_logo/company-logos-01.png';
        }

        $settings->update($validated);

        Cache::forget('shared.invoiceSettings');

        return redirect()->route('admin.invoice-settings.index')->with('success', 'Invoice settings updated successfully.');
    }
}
