<?php

namespace App\Http\Controllers;

use App\Events\BookingUpdated;
use App\Exceptions\BookingExtensionException;
use App\Http\Requests\ExtendBookingRequest;
use App\Mail\BookingExtended;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingExtended as BookingExtendedNotification;
use App\Services\AdminNotificationService;
use App\Services\BookingExtensionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BookingExtensionController extends Controller
{
    public function __construct(
        private BookingExtensionService $service,
    ) {}

    /**
     * Render the extend-rental page for guest / user / admin access.
     */
    public function page(Request $request)
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $context = $this->service->canExtend($booking);

        $routeName = $request->route()->getName();
        $isGuestRoute = str_starts_with((string) $routeName, 'bookings.guest.');
        $isAdminRoute = str_starts_with((string) $routeName, 'admin.');

        $booking->load([
            'car', 'guest', 'payment', 'couponUsage', 'bookingTaxes',
            'pickupLocation', 'returnLocation', 'pickupHandover', 'returnHandover',
        ]);

        if ($isAdminRoute) {
            $booking->loadMissing('payments');
        }

        if ($isAdminRoute) {
            $backUrl = route('admin.bookings.show', $booking->id);
            $quoteUrl = route('admin.bookings.extend.quote', $booking->id);
            $submitUrl = route('admin.bookings.extend.submit', $booking->id);
        } elseif ($isGuestRoute) {
            $backUrl = route('bookings.guest.show', $booking->reference_code ?? $booking->id);
            $quoteUrl = route('bookings.guest.extend.quote', $booking->reference_code ?? $booking->id);
            $submitUrl = route('bookings.guest.extend.submit', $booking->reference_code ?? $booking->id);
        } else {
            $backUrl = route('bookings.show', $booking->id);
            $quoteUrl = route('bookings.extend.quote', $booking->id);
            $submitUrl = route('bookings.extend.submit', $booking->id);
        }

        return Inertia::render($isAdminRoute ? 'Admin/Bookings/Extend' : 'Bookings/Extend', [
            'booking' => $booking,
            'extendable' => $context['allowed'],
            'extendBlockedMessage' => $context['message'],
            'maxExtendableDate' => $context['max_extendable_date'],
            'maxReturnTime' => $context['max_return_time'],
            'quoteUrl' => $quoteUrl,
            'submitUrl' => $submitUrl,
            'backUrl' => $backUrl,
            'isGuest' => $isGuestRoute,
            'isAdmin' => $isAdminRoute,
        ]);
    }

    /**
     * Live price + availability quote for the requested extension window.
     */
    public function quote(Request $request): JsonResponse
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $validated = $request->validate([
            'new_end_date' => 'required|date',
            'new_return_time' => 'nullable|string|max:5',
            'car_id' => 'nullable|integer|exists:tblcars,id',
        ]);

        try {
            $quote = $this->service->quote(
                $booking,
                $validated['new_end_date'],
                $validated['new_return_time'] ?? $booking->return_time,
                $validated['car_id'] ?? null,
            );

            return response()->json($quote);
        } catch (BookingExtensionException $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'max_extendable_date' => $e->maxExtendableDate,
                'alternate_cars' => $e->alternateCars,
            ], 422);
        } catch (HttpException $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], $e->getStatusCode() ?: 422);
        }
    }

    /**
     * Confirm and apply the extension. When a different vehicle is chosen the
     * extension becomes a brand-new pending booking on that car (the original
     * booking is left untouched); otherwise the booking is extended in place.
     */
    public function submit(ExtendBookingRequest $request)
    {
        $booking = $this->resolveBooking($request);
        $this->authorizeBooking($booking, $request->user());

        $newEndDate = $request->validated('new_end_date');
        $newReturnTime = $request->validated('new_return_time') ?? $booking->return_time;
        $carId = $request->validated('car_id') ?? null;
        $routeName = $request->route()->getName();

        if ($carId && (int) $carId !== (int) $booking->car_id) {
            try {
                $newBooking = $this->service->rebook($booking, (int) $carId, $newEndDate, $newReturnTime);
            } catch (BookingExtensionException $e) {
                return $this->extensionFailure($request, $e);
            } catch (HttpException $e) {
                return $this->extensionFailure($request, new BookingExtensionException($e->getMessage()));
            }

            $carLabel = trim(($newBooking->car?->brand ?? '').' '.($newBooking->car?->model ?? ''));
            $window = $newBooking->start_date->format('Y-m-d').' to '.$newBooking->end_date->format('Y-m-d');

            return redirect($this->backUrl($routeName, $newBooking))
                ->with('success', 'A new reservation ('.$newBooking->reference_code.') for the '.$carLabel.' from '.$window.' has been created. Your original booking '.$booking->reference_code.' is unchanged.');
        }

        $oldTotal = (float) $booking->total_amount;

        try {
            $booking = $this->service->extend($booking, $newEndDate, $newReturnTime);
        } catch (BookingExtensionException $e) {
            return $this->extensionFailure($request, $e);
        } catch (HttpException $e) {
            return $this->extensionFailure($request, new BookingExtensionException($e->getMessage()));
        }

        $additionalTotal = round((float) $booking->total_amount - $oldTotal, 2);

        try {
            event(new BookingUpdated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed for extended booking: '.$e->getMessage());
        }

        $this->sendNotifications($booking, $additionalTotal);

        $backUrl = $this->backUrl($routeName, $booking);

        return redirect($backUrl)->with('success', 'Your rental has been extended. Please pay the additional balance of $'.number_format($additionalTotal, 2).' at your earliest convenience.');
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

    private function extensionFailure(Request $request, BookingExtensionException $e)
    {
        if ($request->wantsJson() || $request->expectsJson()) {
            return response()->json([
                'error' => $e->getMessage(),
                'max_extendable_date' => $e->maxExtendableDate,
                'alternate_cars' => $e->alternateCars,
            ], 422);
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

    private function sendNotifications(Booking $booking, float $additionalTotal): void
    {
        try {
            $recipient = $booking->guest?->email ?? $booking->user?->email;
            if ($recipient) {
                $booking->loadMissing(['guest', 'user', 'car', 'pickupLocation', 'returnLocation']);
                Mail::to($recipient)->queue(new BookingExtended($booking, $additionalTotal));
            }
        } catch (\Throwable $e) {
            Log::warning('Extension confirmation email failed for booking #'.$booking->id.': '.$e->getMessage());
        }

        AdminNotificationService::send(new BookingExtendedNotification($booking, $additionalTotal));
    }
}
