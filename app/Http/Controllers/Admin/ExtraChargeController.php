<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExtraCharge;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExtraChargeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/ExtraCharges/Index', [
            'extraCharges' => ExtraCharge::orderBy('name')->paginate(10),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Extra Charge,Discount',
            'calculation' => 'required|in:Fixed,Per Day',
            'value_in' => 'required|in:Amount,Percentage',
            'operator' => 'required|in:+,-',
            'rate' => 'nullable|numeric|min:0',
            'taxable' => 'boolean',
            'apply_always' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['rate'] = $validated['rate'] ?? 0;

        ExtraCharge::create($validated);

        return redirect()->route('admin.extra-charges.index')->with('success', 'Extra charge created successfully.');
    }

    public function update(Request $request, ExtraCharge $extraCharge)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:Extra Charge,Discount',
            'calculation' => 'required|in:Fixed,Per Day',
            'value_in' => 'required|in:Amount,Percentage',
            'operator' => 'required|in:+,-',
            'rate' => 'nullable|numeric|min:0',
            'taxable' => 'boolean',
            'apply_always' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['rate'] = $validated['rate'] ?? 0;

        $extraCharge->update($validated);

        return redirect()->route('admin.extra-charges.index')->with('success', 'Extra charge updated successfully.');
    }

    public function destroy(ExtraCharge $extraCharge)
    {
        $extraCharge->delete();

        return redirect()->route('admin.extra-charges.index')->with('success', 'Extra charge deleted successfully.');
    }
}
