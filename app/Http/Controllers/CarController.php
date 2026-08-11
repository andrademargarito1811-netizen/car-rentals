<?php

namespace App\Http\Controllers;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Booking;
use App\Models\Car;
use App\Models\HeroSetting;
use App\Models\Testimonial;
use App\Models\VehicleLocation;
use App\Models\WhyChooseUsItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;

class CarController extends Controller
{
    public function index()
    {
        $cars = Car::available()
            ->with('vehicleClass')
            ->withReviewStats()
            ->limit(8)
            ->get()
            ->map(function ($car) {
                return [
                    'id' => $car->id,
                    'name' => $car->brand.' '.$car->model,
                    'brand' => $car->brand,
                    'model' => $car->model,
                    'year' => $car->year,
                    'category' => $car->vehicle_type ?? 'Standard',
                    'seats' => $car->seats,
                    'transmission' => $car->transmission,
                    'daily_rate' => (float) $car->daily_rate,
                    'image_path' => $car->image_path,
                    'avg_rating' => round((float) $car->avg_rating, 1),
                    'ratings_count' => (int) $car->ratings_count,
                ];
            });

        $totalCars = Car::available()->count();
        $locations = array_map(
            fn ($location) => ['location_id' => $location['location_id'], 'location' => $location['location']],
            Cache::remember(
                'shared.locations',
                HandleInertiaRequests::CACHE_TTL,
                fn () => VehicleLocation::active()->orderBy('sort_order')->get()->toArray(),
            ),
        );
        $whyChooseUsItems = WhyChooseUsItem::active()->get();
        $heroSettings = Cache::remember(
            'shared.heroSettings',
            HandleInertiaRequests::CACHE_TTL,
            fn () => HeroSetting::with('images')->first()?->toArray(),
        );
        $testimonialItems = Testimonial::active()->get();

        return Inertia::render('Cars/Index', [
            'cars' => $cars,
            'totalCars' => $totalCars,
            'locations' => $locations,
            'whyChooseUsItems' => $whyChooseUsItems,
            'whyChooseUsHeading' => $heroSettings['why_choose_us_heading'] ?? 'Built for a Better Rental Experience',
            'whyChooseUsSubheading' => $heroSettings['why_choose_us_subheading'] ?? 'We go the extra mile to make every rental smooth, transparent, and enjoyable from start to finish.',
            'testimonialItems' => $testimonialItems,
        ]);
    }

    public function show(Car $car)
    {
        if (! $car->isAvailable() && ! auth()->user()?->isAdmin()) {
            abort(404);
        }

        $car = Car::withReviewStats()
            ->with([
                'reviews' => fn ($q) => $q->where('is_approved', true)->latest(),
                'reviews.user:id,name',
                'reviews.guest:guest_id,first_name,last_name',
            ])
            ->findOrFail($car->id);

        $similarCars = Car::where('id', '!=', $car->id)
            ->whereHas('availability', fn ($q) => $q->where('available_desc', 'available'))
            ->where(function ($q) use ($car) {
                $q->where('brand', $car->brand);
            })
            ->orderByDesc('daily_rate')
            ->limit(4)
            ->withReviewStats()
            ->get(['id', 'brand', 'model', 'year', 'daily_rate', 'image_path', 'class_id']);

        return Inertia::render('Cars/Show', [
            'car' => $car,
            'booked_dates' => $car->bookedDates(60),
            'similar_cars' => $similarCars,
            'reviews' => $car->reviews->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'created_at' => $review->created_at?->toDateString(),
                'customer_name' => $review->user?->name ?? trim(($review->guest?->first_name ?? '').' '.($review->guest?->last_name ?? '')),
            ])->values(),
        ]);
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
        if (! $car) {
            return response()->json(['available' => false, 'message' => 'Car not found'], 404);
        }

        $graceMinutes = $car->getGraceMinutes();
        $pickupDT = $validated['pickup_date'].' 00:00:00';
        $returnDT = $validated['return_date'].' 23:59:59';
        $excludeId = $validated['exclude_booking_id'] ?? null;

        $overlapExists = Booking::overlappingBetween($car->id, $pickupDT, $returnDT, $graceMinutes, $excludeId)->exists();

        return response()->json([
            'available' => ! $overlapExists,
            'message' => $overlapExists ? 'Car is already booked for these dates' : 'Car is available',
        ]);
    }
}
