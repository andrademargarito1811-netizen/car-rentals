<?php

namespace App\Http\Controllers;

use App\Events\BookingUpdated;
use App\Exceptions\BookingSwapException;
use App\Models\Booking;
use App\Models\Car;
use App\Models\User;
use App\Models\VehicleHandover;
use App\Services\BookingSwapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookingSwapController extends Controller
{
    public function __construct(
        private BookingSwapService $service,
    ) {}

    /**
     * Render the swap-vehicle page for guest / user / admin access.
     */
    public function page(Request $request)
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $booking->load(['car', 'guest', 'payment', 'pickupLocation', 'returnLocation', 'pickupHandover']);

        $routeName = $request->route()->getName();
        $isGuestRoute = str_starts_with((string) $routeName, 'bookings.guest.');
        $isAdminRoute = str_starts_with((string) $routeName, 'admin.');

        if ($isAdminRoute) {
            $backUrl = route('admin.bookings.show', $booking->id);
            $quoteUrl = route('admin.bookings.swap.quote', $booking->id);
            $submitUrl = route('admin.bookings.swap.submit', $booking->id);
        } elseif ($isGuestRoute) {
            $backUrl = route('bookings.guest.show', $booking->reference_code ?? $booking->id);
            $quoteUrl = route('bookings.guest.swap.quote', $booking->reference_code ?? $booking->id);
            $submitUrl = route('bookings.guest.swap.submit', $booking->reference_code ?? $booking->id);
        } else {
            $backUrl = route('bookings.show', $booking->id);
            $quoteUrl = route('bookings.swap.quote', $booking->id);
            $submitUrl = route('bookings.swap.submit', $booking->id);
        }

        $cars = Car::with(['vehicleClass', 'availability'])
            ->available()
            ->where('id', '!=', $booking->car_id)
            ->orderBy('daily_rate')
            ->get();

        // Most recent known damage marks per candidate car, so staff confirm or
        // edit existing marks instead of re-inspecting the replacement from scratch.
        $carDamages = [];
        if ($isAdminRoute && $cars->isNotEmpty()) {
            $carDamages = VehicleHandover::query()
                ->whereIn('car_id', $cars->pluck('id'))
                ->orderByDesc('id')
                ->get(['car_id', 'damages'])
                ->groupBy('car_id')
                ->map(function ($group) {
                    $damages = $group->pluck('damages')->first(fn ($d) => is_array($d) && count($d) > 0);

                    return array_values($damages ?? []);
                })
                ->all();
        }

        return Inertia::render($isAdminRoute ? 'Admin/Bookings/Swap' : 'Bookings/Swap', [
            'booking' => $booking,
            'cars' => $cars,
            'swaps' => $booking->swaps()->with(['fromCar', 'toCar'])->get(),
            'carDamages' => $carDamages,
            'quoteUrl' => $quoteUrl,
            'submitUrl' => $submitUrl,
            'backUrl' => $backUrl,
            'isGuest' => $isGuestRoute,
            'isAdmin' => $isAdminRoute,
        ]);
    }

    /**
     * Live price + availability quote for swapping to another car.
     */
    public function quote(Request $request): JsonResponse
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $validated = $request->validate([
            'car_id' => 'required|integer|exists:tblcars,id',
            'swap_date' => 'required|date',
            'swap_time' => 'nullable|string|max:5',
        ]);

        try {
            $quote = $this->service->quote(
                $booking,
                (int) $validated['car_id'],
                $validated['swap_date'],
                $validated['swap_time'] ?? null,
            );

            return response()->json($quote);
        } catch (BookingSwapException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        } catch (HttpException $e) {
            return response()->json(['error' => $e->getMessage()], $e->getStatusCode() ?: 422);
        }
    }

    /**
     * Confirm and apply the vehicle swap.
     */
    public function submit(Request $request)
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $routeName = $request->route()->getName();
        $isAdminRoute = $routeName && str_starts_with($routeName, 'admin.');

        $rules = [
            'car_id' => 'required|integer|exists:tblcars,id',
            'swap_date' => 'required|date',
            'swap_time' => 'nullable|string|max:5',
        ];

        // Admin-driven swaps capture the outgoing car's handover and the
        // replacement car's baseline so each car is later charged against its
        // own fuel/odometer. Guest-driven swaps keep the light-weight flow.
        if ($isAdminRoute) {
            $rules['swap_out_fuel'] = 'required|integer|min:0|max:8';
            $rules['swap_out_odometer'] = 'required|numeric|min:0';
            $rules['swap_out_notes'] = 'nullable|string|max:1000';
            $rules['swap_in_fuel'] = 'required|integer|min:0|max:8';
            $rules['swap_in_odometer'] = 'required|numeric|min:0';
            $rules['swap_in_notes'] = 'nullable|string|max:1000';

            foreach (['swap_out_damages', 'swap_in_damages'] as $damageField) {
                $rules[$damageField] = 'nullable|array';
                $rules[$damageField.'.*.zone'] = 'required|string|max:50';
                $rules[$damageField.'.*.type'] = 'required|string|max:50';
                $rules[$damageField.'.*.severity'] = 'required|in:minor,moderate,severe';
                $rules[$damageField.'.*.note'] = 'nullable|string|max:500';
                $rules[$damageField.'.*.position'] = 'nullable|string|max:50';
                $rules[$damageField.'.*.x'] = 'nullable|numeric|min:0|max:1';
                $rules[$damageField.'.*.y'] = 'nullable|numeric|min:0|max:1';
                $rules[$damageField.'.*.photo'] = ['nullable', function ($attribute, $value, $fail) {
                    if (is_string($value)) {
                        return; // existing stored path
                    }
                    if ($value instanceof UploadedFile) {
                        if (! $value->isValid()) {
                            $fail('The uploaded photo is invalid.');

                            return;
                        }
                        if (! in_array($value->getClientMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)) {
                            $fail('The photo must be a JPG, PNG or WEBP image.');

                            return;
                        }
                        if ($value->getSize() > 5120 * 1024) {
                            $fail('The photo may not be greater than 5MB.');
                        }

                        return;
                    }
                    $fail('The photo is invalid.');
                }];
            }

            // Require an explicit acknowledgement when no damage is marked, so a
            // skipped inspection cannot silently pass the swap.
            $noDamageFields = ['swap_out_no_damage' => 'the returning vehicle has no damage', 'swap_in_no_damage' => 'the replacement vehicle has no damage'];
            foreach ($noDamageFields as $field => $label) {
                $damagesField = str_replace('_no_damage', '_damages', $field);
                $rules[$field] = ['nullable', 'boolean', function ($attribute, $value, $fail) use ($request, $damagesField, $label) {
                    if (empty($request->input($damagesField)) && ! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $fail("Please confirm that {$label} before swapping.");
                    }
                }];
            }
        }

        $validated = $request->validate($rules);

        // Persist freshly uploaded damage photos before handing the payload to
        // the service (the stored path is what ends up in the handover record).
        if ($isAdminRoute) {
            foreach (['swap_out_damages', 'swap_in_damages'] as $damageField) {
                if (! empty($validated[$damageField])) {
                    $validated[$damageField] = $this->storeDamagePhotos($request, $validated[$damageField], $damageField);
                }
            }
        }

        try {
            $booking = $this->service->swap(
                $booking,
                (int) $validated['car_id'],
                $validated['swap_date'],
                $validated['swap_time'] ?? null,
                $validated,
            );
        } catch (BookingSwapException $e) {
            return $this->swapFailure($request, $e);
        } catch (HttpException $e) {
            return $this->swapFailure($request, new BookingSwapException($e->getMessage()));
        }

        try {
            event(new BookingUpdated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed for swapped booking: '.$e->getMessage());
        }

        $success = 'Vehicle swapped successfully. New booking total is $'.number_format((float) $booking->total_amount, 2).'.';

        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json([
                'success' => true,
                'booking_id' => $booking->id,
                'reference_code' => $booking->reference_code,
                'total_amount' => $booking->total_amount,
            ]);
        }

        return redirect($this->backUrl($routeName, $booking))->with('success', $success);
    }

    private function storeDamagePhotos(Request $request, array $damages, string $field): array
    {
        foreach ($damages as $index => $damage) {
            $photo = $request->file("{$field}.{$index}.photo");
            if ($photo) {
                $damages[$index]['photo'] = $photo->store('damage-photos', 'public');
            }
        }

        return $damages;
    }

    private function resolveBooking(Request $request): Booking
    {
        $booking = $request->route('booking');

        if ($booking instanceof Booking) {
            return $booking;
        }

        if ($booking) {
            return Booking::findOrFail((int) $booking);
        }

        $reference = $request->route('reference');

        return Booking::where('reference_code', $reference)->firstOrFail();
    }

    private function authorizeBooking(Booking $booking, ?User $user): void
    {
        if ($user && $user->isAdmin()) {
            return;
        }

        if ($booking->user_id) {
            abort_unless($user && $booking->user_id === $user->id, 403);
        } else {
            abort_unless($user === null, 403);
        }
    }

    private function swapFailure(Request $request, BookingSwapException $e)
    {
        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        return redirect()->back()
            ->with('error', $e->getMessage())
            ->withErrors(['error' => $e->getMessage()]);
    }

    private function backUrl(?string $routeName, Booking $booking): string
    {
        if ($routeName && str_starts_with($routeName, 'admin.')) {
            return route('admin.bookings.show', $booking->id);
        }

        if ($routeName && str_starts_with($routeName, 'bookings.guest.')) {
            return route('bookings.guest.show', $booking->reference_code ?? $booking->id);
        }

        return route('bookings.show', $booking->id);
    }
}
