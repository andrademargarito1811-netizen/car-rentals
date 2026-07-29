<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Models\VehicleLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CarController extends Controller
{
    public function index()
    {
        $cars = Car::available()
            ->with('vehicleClass')
            ->limit(8)
            ->get()
            ->map(function ($car) {
                return [
                    'id' => $car->id,
                    'name' => $car->brand . ' ' . $car->model,
                    'brand' => $car->brand,
                    'model' => $car->model,
                    'year' => $car->year,
                    'category' => $car->vehicle_type ?? 'Standard',
                    'seats' => $car->seats,
                    'transmission' => $car->transmission,
                    'daily_rate' => (float) $car->daily_rate,
                    'image_path' => $car->image_path,
                    'avg_rating' => 4.8,
                    'ratings_count' => rand(100, 500),
                ];
            });

        $totalCars = Car::available()->count();
        $locations = VehicleLocation::active()->get(['location_id', 'location']);

        return Inertia::render('Cars/Index', [
            'cars' => $cars,
            'totalCars' => $totalCars,
            'locations' => $locations,
        ]);
    }

    public function show(Car $car)
    {
        if (!$car->isAvailable() && !auth()->user()?->isAdmin()) {
            abort(404);
        }

        $similarCars = Car::where('id', '!=', $car->id)
            ->whereHas('availability', fn($q) => $q->where('available_desc', 'available'))
            ->where(function ($q) use ($car) {
                $q->where('brand', $car->brand);
            })
            ->orderByDesc('daily_rate')
            ->limit(4)
            ->get(['id', 'brand', 'model', 'year', 'daily_rate', 'image_path']);

        return Inertia::render('Cars/Show', [
            'car' => $car,
            'booked_dates' => $car->bookedDates(60),
            'similar_cars' => $similarCars,
        ]);
    }

    public function getAvailableCars(Request $request)
    {
        $perPage = min((int) $request->get('per_page', 50), 100);
        return response()->json(Car::available()->paginate($perPage));
    }

    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:tblcars,id',
            'pickup_date' => 'required|date',
            'return_date' => 'required|date|after_or_equal:pickup_date',
            'exclude_booking_id' => 'nullable|integer',
        ]);

        $car = Car::with('vehicleClass')->find($validated['car_id']);
        if (!$car) {
            return response()->json(['available' => false, 'message' => 'Car not found'], 404);
        }

        $graceMinutes = $car->getGraceMinutes();
        $pickupDT = $validated['pickup_date'] . ' 00:00:00';
        $returnDT = $validated['return_date'] . ' 23:59:59';
        $excludeId = $validated['exclude_booking_id'] ?? null;

        $overlapExists = \App\Models\Booking::overlappingBetween($car->id, $pickupDT, $returnDT, $graceMinutes, $excludeId)->exists();

        return response()->json([
            'available' => !$overlapExists,
            'message' => $overlapExists ? 'Car is already booked for these dates' : 'Car is available',
        ]);
    }
}
