<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tax;
use App\Models\TaxCategory;
use App\Models\VehicleLocation;
use App\Models\VehicleClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxController extends Controller
{
    public function index()
    {
        $taxes = Tax::with(['category', 'location', 'vehicleClasses'])
            ->latest()
            ->paginate(10);

        $categories = TaxCategory::orderBy('name')->get(['id', 'name']);
        $locations = VehicleLocation::active()->orderBy('location')->get(['location_id', 'location']);
        $vehicleClasses = VehicleClass::active()->orderBy('class_no')->get(['class_no', 'class_desc']);

        return Inertia::render('Admin/Tax/Index', [
            'taxes' => $taxes,
            'categories' => $categories,
            'locations' => $locations,
            'vehicleClasses' => $vehicleClasses,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tax_desc' => 'required|string|max:255',
            'calculation' => 'required|in:Per Day,Per Rental',
            'category_id' => 'required|exists:tax_categories,id',
            'value_in' => 'required|in:Amount,Percentage',
            'add_or_minus' => 'required|boolean',
            'rate' => 'required|numeric|min:0',
            'apply_always' => 'required|boolean',
            'location_id' => 'nullable|exists:tblvehicle_location,location_id',
            'vehicle_classes' => 'nullable|array',
            'vehicle_classes.*' => 'exists:tblvehicle_classes,class_no',
            'is_active' => 'boolean',
        ]);

        $vehicleClasses = $validated['vehicle_classes'] ?? [];
        unset($validated['vehicle_classes']);

        $tax = Tax::create($validated);

        if (!empty($vehicleClasses)) {
            $tax->vehicleClasses()->attach($vehicleClasses);
        }

        return redirect()->route('admin.tax.index')->with('success', 'Tax created successfully.');
    }

    public function update(Request $request, Tax $tax)
    {
        $validated = $request->validate([
            'tax_desc' => 'required|string|max:255',
            'calculation' => 'required|in:Per Day,Per Rental',
            'category_id' => 'required|exists:tax_categories,id',
            'value_in' => 'required|in:Amount,Percentage',
            'add_or_minus' => 'required|boolean',
            'rate' => 'required|numeric|min:0',
            'apply_always' => 'required|boolean',
            'location_id' => 'nullable|exists:tblvehicle_location,location_id',
            'vehicle_classes' => 'nullable|array',
            'vehicle_classes.*' => 'exists:tblvehicle_classes,class_no',
            'is_active' => 'boolean',
        ]);

        $vehicleClasses = $validated['vehicle_classes'] ?? [];
        unset($validated['vehicle_classes']);

        $tax->update($validated);
        $tax->vehicleClasses()->sync($vehicleClasses);

        return redirect()->route('admin.tax.index')->with('success', 'Tax updated successfully.');
    }

    public function destroy(Tax $tax)
    {
        $tax->delete();

        return redirect()->route('admin.tax.index')->with('success', 'Tax deleted successfully.');
    }
}
