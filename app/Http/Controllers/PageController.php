<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\FleetPageSetting;
use App\Models\LegalDocument;
use App\Models\LocationsPageSetting;
use App\Models\ReservationSetting;
use App\Models\VehicleLocation;
use App\Models\WhyBookItem;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function fleet(Request $request)
    {
        $today = now()->startOfDay();
        $end = now()->addDays(60)->endOfDay();

        $query = Car::available()->withReviewStats();

        $brand = $request->string('brand')->trim()->toString();
        if ($brand !== '' && $brand !== 'all') {
            $query->where('brand', $brand);
        }

        $search = $request->string('query')->trim()->toString();
        if ($search !== '') {
            $query->where(function ($w) use ($search) {
                $w->where('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        $vehicleType = $request->string('vehicle_type')->trim()->toString();
        if ($vehicleType !== '' && $vehicleType !== 'any') {
            $query->whereHas('vehicleClass', fn ($vq) => $vq->where('class_desc', $vehicleType));
        }

        $fuel = $request->string('fuel')->trim()->lower()->toString();
        if ($fuel !== '' && $fuel !== 'any') {
            $query->whereRaw('LOWER(fuel_type) = ?', [$fuel === 'petrol' ? 'gasoline' : $fuel]);
        }

        $transmission = $request->string('transmission')->trim()->toString();
        if ($transmission !== '' && $transmission !== 'any') {
            $query->whereRaw('LOWER(transmission) = ?', [strtolower($transmission)]);
        }

        $minSeats = (int) $request->integer('min_seats', 0);
        if ($minSeats > 0) {
            $query->where('seats', '>=', $minSeats);
        }

        $minBaggage = (int) $request->integer('min_baggage', 0);
        if ($minBaggage > 0) {
            $query->where('baggage_capacity', '>=', $minBaggage);
        }

        $priceMin = (int) $request->integer('price_min', 0);
        $priceMax = (int) $request->integer('price_max', 0);
        if ($priceMin > 0) {
            $query->where('daily_rate', '>=', $priceMin);
        }
        if ($priceMax > 0) {
            $query->where('daily_rate', '<=', $priceMax);
        }

        $yearMin = (int) $request->integer('year_min', 0);
        $yearMax = (int) $request->integer('year_max', 0);
        if ($yearMin > 0) {
            $query->where('year', '>=', $yearMin);
        }
        if ($yearMax > 0) {
            $query->where('year', '<=', $yearMax);
        }

        $filterPreset = $request->string('filter')->trim()->toString();
        switch ($filterPreset) {
            case 'available':
                $query->whereDoesntHave('bookings', function ($bq) use ($today, $end) {
                    $bq->whereIn('status', ['confirmed', 'active'])
                        ->where(function ($o) use ($today, $end) {
                            $o->where(function ($x) use ($today, $end) {
                                $x->where('start_date', '<', $end)
                                    ->where('end_date', '>', $today);
                            })->orWhere(function ($y) use ($today, $end) {
                                $y->whereRaw('DATE(start_date) = DATE(end_date)')
                                    ->where('start_date', '>=', $today->toDateString())
                                    ->where('start_date', '<=', $end->toDateString());
                            });
                        });
                });
                break;
            case 'top-rated':
                $query->whereHas('reviews', function ($rq) {
                    $rq->select('car_id')
                        ->where('rating', '>', 0)
                        ->where('is_approved', true)
                        ->groupBy('car_id')
                        ->havingRaw('AVG(rating) >= 4.5 AND COUNT(*) >= 3');
                });
                break;
            case 'value':
                $query->where('daily_rate', '<=', 80);
                break;
        }

        $matchDates = $request->boolean('match_dates');
        $startDate = $request->string('start_date')->trim()->toString();
        $endDate = $request->string('end_date')->trim()->toString();
        if ($matchDates && $startDate !== '' && $endDate !== '') {
            $query->whereDoesntHave('bookings', function ($bq) use ($startDate, $endDate) {
                $bq->whereIn('status', ['confirmed', 'active'])
                    ->where(function ($o) use ($startDate, $endDate) {
                        $o->where(function ($x) use ($startDate, $endDate) {
                            $x->where('start_date', '<', $endDate)
                                ->where('end_date', '>', $startDate);
                        })->orWhere(function ($y) use ($startDate, $endDate) {
                            $y->whereRaw('DATE(start_date) = DATE(end_date)')
                                ->where('start_date', '>=', $startDate)
                                ->where('start_date', '<=', $endDate);
                        });
                    });
            });
        }

        $sort = $request->string('sort', 'recommended')->trim()->toString();
        switch ($sort) {
            case 'price-asc':
                $query->orderBy('daily_rate', 'asc')->orderBy('id', 'asc');
                break;
            case 'price-desc':
                $query->orderBy('daily_rate', 'desc')->orderBy('id', 'desc');
                break;
            case 'rating':
                $query->orderByRaw('reviews_avg_rating IS NULL, reviews_avg_rating DESC, reviews_count DESC, id DESC');
                break;
            default:
                if ($matchDates && $startDate !== '' && $endDate !== '') {
                    $query->orderByRaw(
                        "(SELECT 1 FROM bookings b WHERE b.car_id = tblcars.id AND b.status IN ('confirmed','active') AND ((b.start_date < ? AND b.end_date > ?) OR (DATE(b.start_date) = DATE(b.end_date) AND DATE(b.start_date) >= ? AND DATE(b.start_date) <= ?))) ASC",
                        [$endDate, $startDate, $startDate, $endDate]
                    );
                }
                $query->orderByRaw('reviews_avg_rating IS NULL, reviews_avg_rating DESC, reviews_count DESC, id DESC');
                break;
        }

        $cars = $query->paginate(12);
        $cars->load(['bookings' => fn ($q) => $q
            ->whereIn('status', ['confirmed', 'active'])
            ->where('end_date', '>=', $today)
            ->where('start_date', '<=', $end),
        ]);
        $cars->getCollection()->transform(function ($car) {
            $car->booked_dates = $car->bookedDates(60);

            return $car;
        });

        $fleetSettings = FleetPageSetting::first();

        $allCars = Car::available();
        $priceRow = (clone $allCars)
            ->selectRaw('MIN(CAST(daily_rate AS DECIMAL(10,2))) as min_rate, MAX(CAST(daily_rate AS DECIMAL(10,2))) as max_rate')
            ->first();
        $yearRow = (clone $allCars)
            ->selectRaw('MIN(year) as min_year, MAX(year) as max_year')
            ->first();
        $brandCounts = Car::available()
            ->selectRaw('brand, COUNT(*) as c')
            ->groupBy('brand')
            ->orderBy('brand')
            ->pluck('c', 'brand')
            ->toArray();
        $brandTotal = array_sum($brandCounts);
        $brandCounts = ['all' => $brandTotal] + $brandCounts;

        $vehicleTypes = Car::available()
            ->join('tblvehicle_classes', 'tblcars.class_id', '=', 'tblvehicle_classes.class_no')
            ->select('tblvehicle_classes.class_desc')
            ->distinct()
            ->orderBy('tblvehicle_classes.class_desc')
            ->pluck('tblvehicle_classes.class_desc')
            ->toArray();

        return Inertia::render('Fleet', [
            'cars' => $cars,
            'brandCounts' => $brandCounts,
            'vehicleTypes' => $vehicleTypes,
            'filters' => [
                'priceRange' => [
                    'min' => (float) ($priceRow->min_rate ?? 0),
                    'max' => (float) ($priceRow->max_rate ?? 500),
                ],
                'yearRange' => [
                    'min' => (int) ($yearRow->min_year ?? now()->year - 10),
                    'max' => (int) ($yearRow->max_year ?? now()->year),
                ],
            ],
            'fleetSettings' => $fleetSettings,
        ]);
    }

    public function locations()
    {
        $locations = VehicleLocation::active()->orderBy('sort_order')->get();
        $pageSettings = LocationsPageSetting::first();

        return Inertia::render('Locations', [
            'locations' => $locations,
            'pageSettings' => $pageSettings,
        ]);
    }

    public function about()
    {
        return Inertia::render('About');
    }

    public function contact()
    {
        return Inertia::render('Contact');
    }

    public function reservations()
    {
        $reservationSettings = ReservationSetting::with('heroImages')->first();
        $whyBookItems = WhyBookItem::active()->get();
        $locations = VehicleLocation::active()->orderBy('sort_order')->get();

        return Inertia::render('Reservation', [
            'reservationSettings' => $reservationSettings,
            'whyBookItems' => $whyBookItems,
            'pageLocations' => $locations,
        ]);
    }

    public function bookNow(string $carId)
    {
        $car = Car::findOrFail($carId);

        $rental = request()->only([
            'pickup_date', 'pickup_time', 'pickup_location',
            'return_date', 'return_time', 'return_location',
        ]);

        $data = [
            'carId' => $carId,
            'car' => $car,
            'booked_dates' => $car->bookedDates(60),
            'legalDocument' => $this->getDocument('terms-and-conditions'),
        ];

        if (! empty($rental['pickup_date'])) {
            $data['rental'] = $rental;
        }

        return Inertia::render('BookNow', $data);
    }

    public function privacyPolicy()
    {
        return Inertia::render('Legal/PrivacyPolicy', [
            'document' => $this->getDocument('privacy-policy'),
        ]);
    }

    public function termsOfService()
    {
        return Inertia::render('Legal/TermsOfService', [
            'document' => $this->getDocument('terms-of-service'),
        ]);
    }

    public function cookiePolicy()
    {
        return Inertia::render('Legal/CookiePolicy', [
            'document' => $this->getDocument('cookie-policy'),
        ]);
    }

    public function termsAndConditions()
    {
        return Inertia::render('Legal/TermsAndConditions', [
            'document' => $this->getDocument('terms-and-conditions'),
        ]);
    }

    protected function getDocument(string $slug): ?LegalDocument
    {
        return LegalDocument::where('slug', $slug)->where('is_active', true)->first();
    }

    public function dashboard()
    {
        $bookings = Booking::with('car')
            ->where('user_id', auth()->id())
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'recentBookings' => $bookings,
            'stats' => [
                'total_bookings' => Booking::where('user_id', auth()->id())->count(),
                'active_bookings' => Booking::where('user_id', auth()->id())->active()->count(),
            ],
        ]);
    }
}
