<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\VehicleClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleClassController extends Controller
{
    public function index()
    {
        $classes = VehicleClass::orderBy('class_desc')->paginate(20);

        return Inertia::render('Admin/VehicleClasses/Index', [
            'classes' => $classes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_desc' => 'required|string|max:100',
            'grace_minutes' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $validated['class_no'] = $this->generateClassNo($validated['class_desc']);

        VehicleClass::create($validated);

        return redirect()->route('admin.vehicle-classes.index')->with('success', 'Vehicle class created successfully.');
    }

    private function generateClassNo(string $description): string
    {
        $base = strtoupper(preg_replace('/[^a-zA-Z0-9]+/', '_', trim($description)));
        $base = trim($base, '_');
        $code = $base;

        $counter = 1;
        while (VehicleClass::where('class_no', $code)->exists()) {
            $code = $base . '_' . $counter;
            $counter++;
        }

        return $code;
    }

    public function update(Request $request, VehicleClass $vehicleClass)
    {
        $validated = $request->validate([
            'class_no' => 'required|string|max:20|unique:tblvehicle_classes,class_no,' . $vehicleClass->class_no . ',class_no',
            'class_desc' => 'required|string|max:100',
            'grace_minutes' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $vehicleClass->update($validated);

        return redirect()->route('admin.vehicle-classes.index')->with('success', 'Vehicle class updated successfully.');
    }

    public function destroy(VehicleClass $vehicleClass)
    {
        $vehicleClass->delete();

        return redirect()->route('admin.vehicle-classes.index')->with('success', 'Vehicle class deleted successfully.');
    }
}
