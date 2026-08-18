<?php

namespace App\Http\Controllers\Admin;

use App\Events\BookingUpdated;
use App\Exceptions\BookingStatusException;
use App\Http\Controllers\Controller;
use App\Http\Requests\ModifyBookingRequest;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\ExtraCharge;
use App\Models\InvoiceSetting;
use App\Models\LegalDocument;
use App\Models\Payment;
use App\Models\VehicleHandover;
use App\Models\VehicleLocation;
use App\Notifications\PaymentReceived;
use App\Services\AdminNotificationService;
use App\Services\BookingModificationService;
use App\Services\BookingStatusService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function show(Booking $booking)
    {
        $booking->load(['user', 'guest', 'car', 'payment', 'payments', 'pickupLocation', 'returnLocation', 'pickupHandover', 'returnHandover', 'bookingTaxes.tax', 'extraCharges', 'couponUsage', 'swaps.fromCar', 'swaps.toCar']);
        $booking->setAttribute('extension_source', $booking->extensionSource());
        $booking->setAttribute('extension_children', $booking->extensionChildren());
        $booking->setAttribute('timeline', $booking->activityTimeline());
        $booking->setAttribute('swap_segments', $booking->swapSegments());

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => $booking,
            'extraCharges' => ExtraCharge::active()->orderBy('name')->get(),
        ]);
    }

    public function invoice(Booking $booking)
    {
        $booking->load([
            'user', 'guest', 'car.vehicleClass', 'driver', 'payments', 'bookingTaxes.tax', 'couponUsage',
            'pickupLocation', 'returnLocation', 'pickupHandover', 'returnHandover', 'extraCharges',
            'swaps.fromCar', 'swaps.toCar',
        ]);

        $booking->setAttribute('swap_segments', $booking->swapSegments());

        $invoiceTerms = LegalDocument::where('slug', 'invoice-terms-online')
            ->where('is_active', true)
            ->first();

        $invoiceTerms2 = LegalDocument::where('slug', 'invoice-terms-walkin')
            ->where('is_active', true)
            ->first();

        $termsConditions = LegalDocument::where('slug', 'terms-and-conditions')
            ->where('is_active', true)
            ->first();

        return Inertia::render('Admin/Bookings/Invoice', [
            'booking' => $booking,
            'driver' => $booking->driver ? [
                'driver_id' => $booking->driver->driver_id,
                'guest_id' => $booking->driver->guest_id,
                'first_name' => $booking->driver->first_name,
                'last_name' => $booking->driver->last_name,
                'birth_date' => $booking->driver->birth_date?->format('Y-m-d'),
                'license_category' => $booking->driver->license_category,
                'license_expiry' => $booking->driver->license_expiry?->format('Y-m-d'),
                'masked_license' => $booking->driver->maskedLicenseNumber(),
            ] : null,
            'invoiceTerms' => $invoiceTerms ? [
                'title' => $invoiceTerms->title,
                'subtitle' => $invoiceTerms->subtitle,
                'content' => $invoiceTerms->content,
            ] : null,
            'invoiceTerms2' => $invoiceTerms2 ? [
                'title' => $invoiceTerms2->title,
                'subtitle' => $invoiceTerms2->subtitle,
                'content' => $invoiceTerms2->content,
            ] : null,
            'termsConditions' => $termsConditions ? [
                'title' => $termsConditions->title,
                'subtitle' => $termsConditions->subtitle,
                'content' => $termsConditions->content,
            ] : null,
            'invoiceSettings' => InvoiceSetting::first(),
        ]);
    }

    public function checkout(Booking $booking)
    {
        if ($booking->status !== 'confirmed') {
            return redirect()->route('admin.bookings.show', $booking->id);
        }

        $booking->load(['user', 'guest', 'car', 'payment', 'payments', 'pickupHandover', 'returnHandover']);

        // Pre-fill existing damage from the car's most recent handover (pickup or
        // return) so staff only confirm/edit marks instead of re-entering them.
        // Matched on the car itself, so a swapped-in vehicle shows its own
        // damage history rather than the outgoing car's.
        $previousDamages = VehicleHandover::query()
            ->where('car_id', $booking->car_id)
            ->orderByDesc('id')
            ->get()
            ->pluck('damages')
            ->first(fn ($damages) => is_array($damages) && count($damages) > 0) ?? [];

        return Inertia::render('Admin/Bookings/Checkout', [
            'booking' => $booking,
            'previousDamages' => array_values($previousDamages),
            'driver' => $booking->driver ? [
                'driver_id' => $booking->driver->driver_id,
                'guest_id' => $booking->driver->guest_id,
                'first_name' => $booking->driver->first_name,
                'last_name' => $booking->driver->last_name,
                'birth_date' => $booking->driver->birth_date?->format('Y-m-d'),
                'license_category' => $booking->driver->license_category,
                'license_expiry' => $booking->driver->license_expiry?->format('Y-m-d'),
                'masked_license' => $booking->driver->maskedLicenseNumber(),
            ] : null,
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $car = $booking->car()->with('vehicleClass')->first();
        $graceMinutes = $car?->getGraceMinutes() ?? config('reservation.default_grace_minutes', 30);

        $newStart = $validated['start_date'].' '.($booking->pickup_time ?? '00:00:00');
        $newEnd = $validated['end_date'].' '.($booking->return_time ?? '23:59:59');
        $overlapExists = Booking::overlappingBetween($booking->car_id, $newStart, $newEnd, $graceMinutes, $booking->id)->exists();
        if ($overlapExists) {
            return redirect()->back()->withErrors([
                'start_date' => 'This car already has a booking that overlaps with the requested dates/times.',
            ])->onlyInput('start_date', 'end_date');
        }

        $oldStart = $booking->start_date->format('Y-m-d');
        $oldEnd = $booking->end_date->format('Y-m-d');

        $booking->update([
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'booking_rescheduled',
            'model_type' => Booking::class,
            'model_id' => $booking->id,
            'description' => "Booking {$booking->reference_code} rescheduled from {$oldStart}–{$oldEnd} to {$validated['start_date']}–{$validated['end_date']}",
            'old_values' => ['start_date' => $oldStart, 'end_date' => $oldEnd],
            'new_values' => ['start_date' => $validated['start_date'], 'end_date' => $validated['end_date']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        try {
            event(new BookingUpdated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed: '.$e->getMessage());
        }

        return redirect()->back()->with('success', 'Booking rescheduled successfully.');
    }

    public function updateStatus(Request $request, Booking $booking, BookingStatusService $statusService)
    {
        try {
            $statusService->transition($request, $booking);

            return redirect()->back()->with('success', 'Booking status updated successfully.');
        } catch (BookingStatusException $e) {
            return redirect()->back()->withErrors(['status' => $e->getMessage()]);
        }
    }

    public function recordPayment(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => ['required', Rule::in(['Cash', 'Card', 'Bank Transfer', 'Online', 'Others'])],
            'transaction_id' => 'nullable|string|max:255',
            'type' => 'required|in:downpayment,remaining,full_payment,refund',
        ]);

        $isRefund = $validated['type'] === 'refund';

        if ($isRefund) {
            $refundable = (float) $booking->completedPayments()
                ->where('payments.type', '!=', 'refund')
                ->sum('amount');

            if ($refundable <= 0) {
                return redirect()->back()->withErrors([
                    'amount' => 'There are no completed payments to refund for this booking.',
                ]);
            }

            if ($validated['amount'] > $refundable) {
                return redirect()->back()->withErrors([
                    'amount' => "Refund \${$validated['amount']} exceeds the refundable amount of \$".number_format($refundable, 2),
                ]);
            }
        } else {
            if ($booking->isFullyRefunded()) {
                return redirect()->back()->withErrors([
                    'amount' => 'This booking has been fully refunded. No further payments can be recorded.',
                ]);
            }

            $remaining = $booking->remainingBalance();
            if ($remaining <= 0) {
                return redirect()->back()->withErrors([
                    'amount' => 'This booking is already fully paid.',
                ]);
            }

            if ($validated['amount'] > $remaining) {
                return redirect()->back()->withErrors([
                    'amount' => "Amount \${$validated['amount']} exceeds remaining balance of \$".number_format($remaining, 2),
                ]);
            }
        }

        $shouldConfirm = $booking->status === 'pending' && in_array($validated['type'], ['downpayment', 'full_payment']);

        $payment = null;

        try {
            DB::transaction(function () use ($request, $booking, $validated, $isRefund, $shouldConfirm, &$payment) {
                $payment = Payment::create([
                    'booking_id' => $booking->id,
                    'type' => $validated['type'],
                    'amount' => $isRefund ? -1 * (float) $validated['amount'] : $validated['amount'],
                    'payment_method' => $validated['payment_method'],
                    'transaction_id' => $validated['transaction_id'] ?? 'ADM-'.strtoupper(Str::random(10)),
                    'payment_status' => 'completed',
                ]);

                AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => $isRefund ? 'refund_recorded' : 'payment_recorded',
                    'model_type' => Payment::class,
                    'model_id' => $payment->id,
                    'description' => ($isRefund ? 'Refund of' : 'Payment of')." \${$validated['amount']} ({$validated['type']}) recorded for booking {$booking->reference_code}",
                    'old_values' => [],
                    'new_values' => $validated,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                if ($shouldConfirm) {
                    $this->consumeCoupon($booking);

                    $booking->update(['status' => 'confirmed']);

                    AuditLog::create([
                        'user_id' => auth()->id(),
                        'action' => 'status_updated',
                        'model_type' => Booking::class,
                        'model_id' => $booking->id,
                        'description' => "Booking status updated from pending to confirmed ({$validated['type']} recorded)",
                        'old_values' => ['status' => 'pending'],
                        'new_values' => ['status' => 'confirmed'],
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);
                }
            });
        } catch (BookingStatusException $e) {
            return redirect()->back()->withErrors(['status' => $e->getMessage()]);
        }

        if ($shouldConfirm) {
            try {
                $recipient = $booking->guest?->email ?? $booking->user?->email;
                if ($recipient) {
                    $booking->load(['guest', 'car', 'pickupLocation', 'returnLocation', 'payment']);
                    Mail::to($recipient)->queue(new GuestBookingConfirmation($booking));
                }
            } catch (\Throwable $e) {
                Log::warning('Confirmation email failed for booking #'.$booking->id.': '.$e->getMessage());
            }
        }

        if ($payment) {
            AdminNotificationService::send(new PaymentReceived($booking, $payment));
        }

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    public function updatePayment(Request $request, Booking $booking, Payment $payment)
    {
        $isRefund = $payment->type === 'refund';

        $validated = $request->validate([
            'amount' => ['required', 'numeric', $isRefund ? 'max:0' : 'min:0.01'],
            'payment_method' => ['required', Rule::in(['Cash', 'Card', 'Bank Transfer', 'Online', 'Others'])],
            'transaction_id' => 'nullable|string|max:255',
        ]);

        // Refunds may not be edited once the booking is fully refunded.
        if ($isRefund && $booking->isFullyRefunded()) {
            return redirect()->back()->withErrors([
                'amount' => 'This booking has been fully refunded. Refund amounts can no longer be edited.',
            ]);
        }

        // Prevent refund edits from over-refunding beyond what was collected.
        if ($isRefund) {
            $otherRefundsTotal = (float) $booking->completedPayments()
                ->where('payments.id', '!=', $payment->id)
                ->where('payments.type', 'refund')
                ->sum('amount');
            $refundable = (float) $booking->completedPayments()
                ->where('payments.type', '!=', 'refund')
                ->sum('amount');
            $totalRefundsAfter = $otherRefundsTotal + (float) $validated['amount'];
            if ($refundable + $totalRefundsAfter < 0) {
                return redirect()->back()->withErrors([
                    'amount' => 'Refund $'.number_format(abs($validated['amount']), 2).' exceeds the refundable amount of $'.number_format(max(0, $refundable + $otherRefundsTotal), 2),
                ]);
            }
        }

        // Prevent editing payments on fully paid bookings.
        if (! $isRefund && $booking->remainingBalance() <= 0) {
            return redirect()->back()->withErrors([
                'amount' => 'Cannot edit payments on a fully paid booking.',
            ]);
        }

        // Prevent overpayment: total paid (excluding this payment) + new amount must not exceed total_amount
        if (! $isRefund) {
            $otherPaymentsTotal = (float) $booking->completedPayments()
                ->where('payments.id', '!=', $payment->id)
                ->where('payments.type', '!=', 'refund')
                ->sum('amount');
            $newTotalPaid = $otherPaymentsTotal + (float) $validated['amount'];
            if ($newTotalPaid > (float) $booking->total_amount) {
                return redirect()->back()->withErrors([
                    'amount' => "Amount \${$validated['amount']} would make total paid (\$".number_format($newTotalPaid, 2).') exceed the booking total of $'.number_format($booking->total_amount, 2),
                ]);
            }
        }

        $oldAmount = $payment->amount;

        $payment->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $isRefund ? 'refund_updated' : 'payment_updated',
            'model_type' => Payment::class,
            'model_id' => $payment->id,
            'description' => ($isRefund ? 'Refund #' : 'Payment #')."{$payment->id} for booking {$booking->reference_code} updated from \$".number_format($oldAmount, 2).' to $'.number_format($validated['amount'], 2),
            'old_values' => ['amount' => $oldAmount],
            'new_values' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('success', ($isRefund ? 'Refund' : 'Payment').' updated successfully.');
    }

    public function edit(Booking $booking)
    {
        $booking->load(['car', 'guest', 'payment', 'couponUsage', 'bookingTaxes', 'pickupLocation', 'returnLocation']);

        $cars = Car::with('location')->available()->get();

        $locations = VehicleLocation::active()->get();

        return Inertia::render('Admin/Bookings/Edit', [
            'booking' => $booking,
            'cars' => $cars,
            'locations' => $locations,
        ]);
    }

    public function modify(ModifyBookingRequest $request, Booking $booking, BookingModificationService $modificationService)
    {
        try {
            $modificationService->modify($booking, $request->validated());

            try {
                event(new BookingUpdated($booking));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed: '.$e->getMessage());
            }

            return redirect()->route('admin.bookings.show', $booking->id)
                ->with('success', 'Booking modified successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Consume a coupon slot when a pending booking is confirmed via a recorded
     * payment (the same capacity enforcement used by status transitions).
     */
    private function consumeCoupon(Booking $booking): void
    {
        $usage = CouponUsage::where('booking_id', $booking->id)->first();
        if (! $usage || ! $usage->coupon) {
            return;
        }

        $coupon = Coupon::whereKey($usage->coupon_id)->lockForUpdate()->first();
        if (! $coupon) {
            return;
        }

        if ($coupon->max_uses !== null && (int) $coupon->user_count >= (int) $coupon->max_uses) {
            throw new BookingStatusException("Cannot confirm — coupon {$coupon->code} has reached its usage limit.");
        }

        $coupon->increment('user_count');
    }
}
