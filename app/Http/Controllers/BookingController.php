<?php

namespace App\Http\Controllers;

use App\Events\BookingUpdated;
use App\Http\Requests\ModifyBookingRequest;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\BookingTax;
use App\Models\Car;
use App\Models\VehicleLocation;
use App\Services\BookingCreationService;
use App\Services\BookingModificationService;
use App\Services\BookingPricingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookingController extends Controller
{
    public function __construct(
        private BookingPricingService $pricing,
    ) {}

    public function index()
    {
        $bookings = Booking::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Bookings/Index', [
            'bookings' => $bookings,
        ]);
    }

    public function create(Car $car)
    {
        return Inertia::render('Bookings/Create', [
            'car' => $car,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:tblcars,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
        ]);

        $car = Car::with('vehicleClass')->findOrFail($validated['car_id']);
        $graceMinutes = $car->getGraceMinutes();

        $newPickup = $validated['start_date'].' 00:00:00';
        $newReturn = $validated['end_date'].' 23:59:59';
        $overlapExists = Booking::overlappingBetween($car->id, $newPickup, $newReturn, $graceMinutes)->exists();
        if ($overlapExists) {
            return back()->withErrors([
                'start_date' => 'This car already has a booking that overlaps with the requested dates.',
            ])->onlyInput('start_date', 'end_date');
        }

        $price = $this->pricing->calculate(
            $car,
            $validated['start_date'],
            null,
            $validated['end_date'],
            null,
            null,
            null,
        );

        $booking = Booking::create([
            'user_id' => auth()->id(),
            'car_id' => $validated['car_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'total_amount' => $price['total'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($price['taxes'] as $item) {
            BookingTax::create([
                'booking_id' => $booking->id,
                'tax_id' => $item['id'] ?? null,
                'tax_desc' => $item['tax_desc'],
                'amount' => $item['amount'],
                'add_or_minus' => $item['add_or_minus'],
            ]);
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'booking_created',
            'model_type' => Booking::class,
            'model_id' => $booking->id,
            'description' => "Booking created for car {$car->brand} {$car->model}",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->route('bookings.index')->with('success', 'Booking created successfully.');
    }

    public function show(Booking $booking)
    {
        if ($booking->user_id !== auth()->id() && ! auth()->user()?->isAdmin()) {
            abort(403);
        }

        return Inertia::render('Bookings/Show', [
            'booking' => $booking->load(['pickupHandover', 'returnHandover']),
        ]);
    }

    public function cancel(Request $request, Booking $booking)
    {
        if ($booking->user_id !== auth()->id() || $booking->status !== 'pending') {
            abort(403);
        }

        $booking->update(['status' => 'cancelled']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'booking_cancelled',
            'model_type' => Booking::class,
            'model_id' => $booking->id,
            'description' => "Booking {$booking->reference_code} cancelled",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('success', 'Booking cancelled successfully.');
    }

    public function guestShow(string $reference)
    {
        $booking = Booking::where('reference_code', $reference)
            ->with(['car', 'guest', 'payment', 'couponUsage', 'bookingTaxes', 'pickupLocation', 'returnLocation', 'pickupHandover', 'returnHandover', 'extraCharges'])
            ->firstOrFail();

        return Inertia::render('Bookings/GuestShow', [
            'booking' => $booking,
        ]);
    }

    public function lookup()
    {
        return Inertia::render('Bookings/Lookup');
    }

    public function search(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'booking_id' => 'required|string',
        ]);

        $booking = Booking::where(function ($q) use ($validated) {
            if (is_numeric($validated['booking_id'])) {
                $q->where('bookings.id', $validated['booking_id']);
            } else {
                $q->where('bookings.reference_code', $validated['booking_id']);
            }
        })
            ->where(function ($q) use ($validated) {
                $q->whereHas('user', function ($query) use ($validated) {
                    $query->where('email', $validated['email']);
                })->orWhereHas('guest', function ($query) use ($validated) {
                    $query->where('email', $validated['email']);
                });
            })
            ->with(['car', 'guest', 'payment', 'couponUsage', 'bookingTaxes', 'pickupLocation', 'returnLocation', 'pickupHandover', 'returnHandover', 'extraCharges'])
            ->first();

        if (! $booking) {
            return back()->withErrors([
                'email' => 'No booking found with the provided email and reservation number.',
            ])->onlyInput('email');
        }

        return Inertia::render('Bookings/GuestShow', [
            'booking' => $booking,
        ]);
    }

    public function storeGuest(Request $request, BookingCreationService $creationService)
    {
        try {
            $validated = $request->validate([
                'title' => 'nullable|string|max:10',
                'first_name' => 'required|string|max:100',
                'last_name' => 'required|string|max:100',
                'driver_age' => 'nullable|integer|min:18|max:120',
                'phone' => 'nullable|string|max:30',
                'email' => 'required|email|max:255',
                'email_confirmation' => 'required|email|same:email',
                'address' => 'nullable|string|max:255',
                'address2' => 'nullable|string|max:255',
                'country' => 'nullable|string|max:100',
                'state' => 'nullable|string|max:100',
                'city' => 'nullable|string|max:100',
                'postal_code' => 'nullable|string|max:20',
                'company_name' => 'nullable|string|max:150',
                'flight_no' => 'nullable|string|max:50',
                'agree_terms' => 'required|accepted',
                'car_id' => 'required|exists:tblcars,id',
                'pickup_date' => 'required|date|after_or_equal:today',
                'pickup_time' => 'nullable|string',
                'pickup_location' => 'nullable|string|max:255',
                'return_date' => 'required|date|after_or_equal:pickup_date',
                'return_time' => 'nullable|string',
                'return_location' => 'nullable|string|max:255',

                'driver_info_required' => 'sometimes|boolean',
                'driver_is_renter' => 'sometimes|boolean',
                'driver_first_name' => 'required_if:driver_info_required,1|string|max:100',
                'driver_last_name' => 'required_if:driver_info_required,1|string|max:100',
                'driver_birth_date' => 'required_if:driver_info_required,1|date|before_or_equal:-18 years',
                'license_number' => 'required_if:driver_info_required,1|string|max:100',
                'license_category' => 'required_if:driver_info_required,1|string|max:20',
                'license_expiry' => 'required_if:driver_info_required,1|date|after:today',

                'coupon_code' => 'nullable|string|max:16',
            ]);
        } catch (ValidationException $e) {
            Log::warning('storeGuest validation failed', ['errors' => $e->errors()]);
            throw $e;
        }

        try {
            $booking = $creationService->create($validated, $request);
        } catch (HttpException $e) {
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'errors' => ['pickup_date' => [$e->getMessage()]],
                ], 422);
            }

            return back()->withErrors([
                'pickup_date' => $e->getMessage(),
            ])->onlyInput('pickup_date', 'return_date', 'pickup_time', 'return_time');
        }

        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json([
                'booking_id' => $booking->id,
                'reference_code' => $booking->reference_code,
                'total_amount' => $booking->total_amount,
            ]);
        }

        if (auth()->user()?->isAdmin()) {
            return redirect()->route('admin.cars.schedule')
                ->with('success', 'Booking created for '.($booking->guest->first_name ?? '').' '.($booking->guest->last_name ?? '').'.');
        }

        return redirect()->route('bookings.lookup')
            ->with('success', 'Reservation created successfully! Your reservation ID is '.$booking->reference_code);
    }

    public function edit(Booking $booking)
    {
        $user = auth()->user();

        if ($booking->user_id && $booking->user_id !== $user?->id && ! $user?->isAdmin()) {
            abort(403);
        }

        $allowedStatuses = (! $user && ! $booking->user_id) ? ['pending'] : ['pending', 'confirmed'];
        if (! in_array($booking->status, $allowedStatuses)) {
            $route = $booking->user_id ? 'bookings.show' : 'bookings.guest.show';
            $param = $booking->user_id ? $booking->id : $booking->reference_code;

            return redirect()->route($route, $param)
                ->with('error', 'Booking can only be modified when status is pending or confirmed.');
        }

        $booking->load(['car', 'guest', 'payment', 'couponUsage', 'bookingTaxes', 'pickupLocation', 'returnLocation']);

        $cars = Car::with('location')->available()->get();

        $locations = VehicleLocation::active()->get();

        return Inertia::render('Bookings/Edit', [
            'booking' => $booking,
            'cars' => $cars,
            'locations' => $locations,
            'isGuest' => ! $booking->user_id && ! $user,
        ]);
    }

    public function editByReference(string $reference)
    {
        $booking = Booking::where('reference_code', $reference)->firstOrFail();

        return $this->edit($booking);
    }

    public function modifyByReference(ModifyBookingRequest $request, string $reference, BookingModificationService $modificationService)
    {
        $booking = Booking::where('reference_code', $reference)->firstOrFail();

        return $this->modify($request, $booking, $modificationService);
    }

    public function modify(ModifyBookingRequest $request, Booking $booking, BookingModificationService $modificationService)
    {
        try {
            $modificationService->modify($booking, $request->validated());

            try {
                event(new BookingUpdated($booking));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed for modified booking: '.$e->getMessage());
            }

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'booking_id' => $booking->id,
                    'reference_code' => $booking->reference_code,
                ]);
            }

            $route = $booking->user_id ? 'bookings.show' : 'bookings.guest.show';
            $param = $booking->user_id ? $booking->id : $booking->reference_code;

            return redirect()->route($route, $param)
                ->with('success', 'Booking modified successfully.');
        } catch (\Exception $e) {
            Log::error('Booking modification failed', [
                'booking_id' => $booking->id,
                'error' => $e->getMessage(),
            ]);

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return redirect()->back()
                ->with('error', $e->getMessage())
                ->withInput();
        }
    }
}
