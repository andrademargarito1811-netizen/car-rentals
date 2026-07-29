<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Booking;
use App\Models\AuditLog;
use App\Models\VehicleLocation;
use App\Models\VehicleClass;
use App\Models\VehicleAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CarController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $sortField = $request->input('sort_field', 'brand');
        $sortDirection = $request->input('sort_direction', 'asc');

        $allowedSorts = ['brand', 'daily_rate', 'year'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'brand';
        }
        $sortDirection = $sortDirection === 'desc' ? 'desc' : 'asc';

        $query = Car::with(['location', 'vehicleClass', 'availability'])
            ->select([
                'id', 'brand', 'model', 'year', 'license_plate', 'daily_rate',
                'color', 'transmission', 'fuel_type', 'seats', 'vehicle_doors',
                'baggage_capacity', 'engine', 'fuel_consumption', 'co2_emission',
                'air_conditioned', 'image_path',
                'location_id', 'class_id', 'availability_id',
                'stock_number', 'description',
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('brand', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('license_plate', 'like', "%{$search}%")
                  ->orWhere('stock_number', 'like', "%{$search}%");
            });
        }

        $cars = $query->orderBy($sortField, $sortDirection)->paginate(15);

        return Inertia::render('Admin/Cars/Index', [
            'cars' => $cars,
            'filters' => [
                'search' => $search,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    public function create()
    {
        $locations = VehicleLocation::active()->get(['location_id', 'location']);
        $classes = VehicleClass::active()->get(['class_no', 'class_desc']);
        $availabilities = VehicleAvailability::active()->get(['available_id', 'available_desc']);
        $recentVehicles = Car::latest()->take(5)->get(['id', 'brand', 'model', 'year', 'license_plate', 'daily_rate', 'created_at']);

        return Inertia::render('Admin/Cars/Create', [
            'locations' => $locations,
            'classes' => $classes,
            'availabilities' => $availabilities,
            'recentVehicles' => $recentVehicles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'required|integer|min:2000|max:2030',
            'license_plate' => 'required|string|unique:tblcars',
            'daily_rate' => 'required|numeric|min:0',
            'fuel_type' => 'required|in:gasoline,diesel,electric,hybrid',
            'seats' => 'required|integer|min:1|max:15',
            'transmission' => 'required|in:automatic,manual',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'location_id' => 'nullable|integer|exists:tblvehicle_location,location_id',
            'class_id' => 'nullable|string|max:50|exists:tblvehicle_classes,class_no',
            'availability_id' => 'nullable|integer|exists:tblvehicle_availability,available_id',
            'stock_number' => 'nullable|string|max:255|unique:tblcars',
            'vin' => 'nullable|string|max:255|unique:tblcars',
            'color' => 'nullable|string|max:255',
            'baggage_capacity' => 'nullable|integer|min:0',
            'vehicle_doors' => 'nullable|integer|min:1|max:9',
            'sale_date' => 'nullable|date',
            'sale_price' => 'nullable|numeric|min:0',
            'sold_to' => 'nullable|string|max:255',
            'air_conditioned' => 'nullable|boolean',
            'maximum_weight' => 'nullable|numeric|min:0',
            'engine' => 'nullable|string|max:255',
            'power_type' => 'nullable|string|max:255',
            'fuel_charges' => 'nullable|numeric|min:0',
            'fuel_consumption' => 'nullable|numeric|min:0',
            'co2_emission' => 'nullable|integer|min:0',
            'vehicle_rate_type' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('cars', 'public');
        }

        $car = Car::create($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'car_created',
            'model_type' => Car::class,
            'model_id' => $car->id,
            'description' => "Car created: {$car->brand} {$car->model} ({$car->license_plate})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('admin.cars.index')->with('success', 'Car created successfully.');
    }

    public function edit(Car $car)
    {
        $locations = VehicleLocation::active()->get(['location_id', 'location']);
        $classes = VehicleClass::active()->get(['class_no', 'class_desc']);
        $availabilities = VehicleAvailability::active()->get(['available_id', 'available_desc']);

        return Inertia::render('Admin/Cars/Edit', [
            'car' => $car,
            'locations' => $locations,
            'classes' => $classes,
            'availabilities' => $availabilities,
        ]);
    }

    public function update(Request $request, Car $car)
    {
        $validated = $request->validate([
            'brand' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'year' => 'required|integer|min:2000|max:2030',
            'license_plate' => 'required|string|unique:tblcars,license_plate,' . $car->id,
            'daily_rate' => 'required|numeric|min:0',
            'fuel_type' => 'required|in:gasoline,diesel,electric,hybrid',
            'seats' => 'required|integer|min:1|max:15',
            'transmission' => 'required|in:automatic,manual',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
            'location_id' => 'nullable|integer|exists:tblvehicle_location,location_id',
            'class_id' => 'nullable|string|max:50|exists:tblvehicle_classes,class_no',
            'availability_id' => 'nullable|integer|exists:tblvehicle_availability,available_id',
            'stock_number' => 'nullable|string|max:255|unique:tblcars,stock_number,' . $car->id,
            'vin' => 'nullable|string|max:255|unique:tblcars,vin,' . $car->id,
            'color' => 'nullable|string|max:255',
            'baggage_capacity' => 'nullable|integer|min:0',
            'vehicle_doors' => 'nullable|integer|min:1|max:9',
            'sale_date' => 'nullable|date',
            'sale_price' => 'nullable|numeric|min:0',
            'sold_to' => 'nullable|string|max:255',
            'air_conditioned' => 'nullable|boolean',
            'maximum_weight' => 'nullable|numeric|min:0',
            'engine' => 'nullable|string|max:255',
            'power_type' => 'nullable|string|max:255',
            'fuel_charges' => 'nullable|numeric|min:0',
            'fuel_consumption' => 'nullable|numeric|min:0',
            'co2_emission' => 'nullable|integer|min:0',
            'vehicle_rate_type' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            if ($car->image_path) {
                Storage::disk('public')->delete($car->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('cars', 'public');
        }

        $car->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'car_updated',
            'model_type' => Car::class,
            'model_id' => $car->id,
            'description' => "Car updated: {$car->brand} {$car->model} ({$car->license_plate})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('admin.cars.index')->with('success', 'Car updated successfully.');
    }

    public function destroy(Request $request, Car $car)
    {
        if ($car->image_path) {
            Storage::disk('public')->delete($car->image_path);
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'car_deleted',
            'model_type' => Car::class,
            'model_id' => $car->id,
            'description' => "Car deleted: {$car->brand} {$car->model} ({$car->license_plate})",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $car->delete();

        return redirect()->route('admin.cars.index')->with('success', 'Car deleted successfully.');
    }

    public function schedule()
    {
        $cars = Car::with(['bookings' => function ($q) {
            $q->whereIn('status', ['pending', 'confirmed', 'active'])
              ->where('end_date', '>=', now()->startOfMonth()->subMonth())
              ->orderBy('start_date');
        }, 'bookings.user', 'bookings.guest', 'location', 'availability', 'vehicleClass'])
            ->select(['id', 'brand', 'model', 'year', 'license_plate', 'color', 'location_id', 'availability_id', 'daily_rate', 'image_path', 'class_id'])
            ->orderBy('brand')
            ->orderBy('model')
            ->get();

        $locations = VehicleLocation::active()->select(['location_id', 'location', 'address'])->get();

        $reservationSettings = \App\Models\ReservationSetting::first();

        return Inertia::render('Admin/Cars/Schedule', [
            'cars' => $cars,
            'locations' => $locations,
            'bookingTerms' => $reservationSettings?->booking_terms,
        ]);
    }
}
