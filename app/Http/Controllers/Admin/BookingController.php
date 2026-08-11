<?php

namespace App\Http\Controllers\Admin;

use App\Events\BookingUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\ModifyBookingRequest;
use App\Mail\BookingCompleted;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Car;
use App\Models\CouponUsage;
use App\Models\ExtraCharge;
use App\Models\InvoiceSetting;
use App\Models\LegalDocument;
use App\Models\Payment;
use App\Models\VehicleHandover;
use App\Models\VehicleLocation;
use App\Services\BookingModificationService;
use App\Services\CheckoutDriverService;
use App\Services\ExtraChargeService;
use App\Services\HandoverChargeCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function show(Booking $booking)
    {
        $booking->load(['user', 'guest', 'car', 'payment', 'payments', 'pickupHandover', 'returnHandover', 'bookingTaxes.tax', 'extraCharges', 'couponUsage']);

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
        ]);

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
        $previousDamages = VehicleHandover::query()
            ->whereHas('booking', fn ($q) => $q->where('car_id', $booking->car_id))
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

    public function updateStatus(Request $request, Booking $booking, HandoverChargeCalculator $calculator, CheckoutDriverService $driverService, ExtraChargeService $extraChargeService)
    {
        $rules = [
            'status' => 'required|in:confirmed,active,completed,cancelled',
        ];

        $currentStatus = $booking->status;

        // Require downpayment amount when transitioning from pending to confirmed
        if ($currentStatus === 'pending' && $request->input('status') === 'confirmed') {
            $rules['downpayment_amount'] = 'required|numeric|min:0.01|max:'.$booking->total_amount;
        }

        // Handover capture rules: fuel + mileage when the guest takes the car
        if ($currentStatus === 'confirmed' && $request->input('status') === 'active') {
            $rules['pickup_fuel'] = 'required|integer|min:0|max:8';
            $rules['pickup_odometer'] = 'required|numeric|min:0';
            $rules['pickup_notes'] = 'nullable|string|max:1000';
            // Require an explicit acknowledgement when no damage is marked.
            $rules['no_damage'] = [function ($attribute, $value, $fail) use ($request) {
                if (empty($request->input('pickup_damages')) && ! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                    $fail('Please confirm that the vehicle has no existing damage before check out.');
                }
            }];

            // Driver license + company capture at check-out. Online bookings never
            // carry license details, so they are mandatory unless a driver is
            // already attached (e.g. admin quick-book).
            $rules['company_name'] = 'nullable|string|max:255';
            $rules['driver_is_renter'] = 'nullable|boolean';

            $requiresDriver = ! $booking->driver_id;
            $rules['driver_first_name'] = $requiresDriver ? 'required|string|max:255' : 'nullable|string|max:255';
            $rules['driver_last_name'] = $requiresDriver ? 'required|string|max:255' : 'nullable|string|max:255';
            $rules['driver_birth_date'] = ($requiresDriver ? 'required|' : 'nullable|').'date|before:'.now()->subYears(18)->format('Y-m-d');
            $rules['license_number'] = $requiresDriver ? 'required|string|max:255' : 'nullable|string|max:255';
            $rules['license_category'] = $requiresDriver ? 'required|string|max:50' : 'nullable|string|max:50';
            $rules['license_expiry'] = ($requiresDriver ? 'required|' : 'nullable|').'date|after:today';
        }

        // Handover capture rules: fuel + mileage when the guest returns the car
        $pickupHandover = $booking->pickupHandover;
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            if (! $pickupHandover) {
                return redirect()->back()->withErrors([
                    'status' => 'A pickup handover (fuel level and odometer at pickup) must be recorded before completing this booking.',
                ]);
            }

            $rules['return_fuel'] = 'required|integer|min:0|max:8';
            $rules['return_odometer'] = 'required|numeric|min:'.(float) $pickupHandover->odometer;
            $rules['return_notes'] = 'nullable|string|max:1000';
            // Require an explicit acknowledgement when no damage is marked.
            $rules['no_damage'] = [function ($attribute, $value, $fail) use ($request) {
                if (empty($request->input('return_damages')) && ! filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                    $fail('Please confirm that the vehicle has no new damage at return.');
                }
            }];

            // Optional extra charges selected at return (e.g. CDW).
            $rules['extra_charges'] = 'nullable|array';
            $rules['extra_charges.*.id'] = 'required|integer|exists:extra_charges,id';
            $rules['extra_charges.*.rate'] = 'nullable|numeric|min:0|max:999999';
        }

        // Structured damage marks for both pickup and return (optional).
        // Each mark may carry a `photo`: either a fresh upload (UploadedFile) or a
        // previously stored path (string) sent back on re-submission.
        foreach (['pickup_damages', 'return_damages'] as $damageField) {
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

        // Compute pending fuel/mileage + extra charges before payment amount
        // rules so the required payment reflects any handover charges.
        $pendingCharges = 0.0;
        $handoverCharges = null;
        $returnHandover = null;
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $returnHandover = new VehicleHandover;
            $returnHandover->booking_id = $booking->id;
            $returnHandover->type = 'return';
            $returnHandover->fuel_level = $request->input('return_fuel');
            $returnHandover->odometer = $request->input('return_odometer');
            $handoverCharges = $calculator->calculate($booking, $pickupHandover, $returnHandover);
            $extraChargesPreview = $extraChargeService->previewTotal($booking, $request->input('extra_charges', []));
            $pendingCharges = (float) $handoverCharges['total'] + $extraChargesPreview;
        }

        // Amount rules for confirmed → active/completed transitions
        if ($currentStatus === 'confirmed') {
            if ($request->input('status') === 'completed') {
                $remaining = $booking->remainingBalance();
                if ($remaining > 0) {
                    $rules['amount'] = 'required|numeric|min:'.$remaining.'|max:'.$remaining;
                } else {
                    $rules['amount'] = 'nullable|numeric|min:0';
                }
            } elseif ($request->input('status') === 'active') {
                $remaining = $booking->remainingBalance();
                $rules['amount'] = 'nullable|numeric|min:0'.($remaining > 0 ? '|max:'.$remaining : '');
            }
        }

        // Amount rules for active → completed transitions (includes handover charges)
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $remaining = $booking->remainingBalance() + $pendingCharges;
            if ($remaining > 0) {
                $rules['amount'] = 'required|numeric|min:'.$remaining.'|max:'.$remaining;
            } else {
                $rules['amount'] = 'nullable|numeric|min:0';
            }
        }

        $validated = $request->validate($rules);

        $allowedTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['active', 'cancelled'],
            'active' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => [],
        ];

        if (! in_array($validated['status'], $allowedTransitions[$currentStatus] ?? [])) {
            return redirect()->back()->withErrors([
                'status' => "Cannot transition from '{$currentStatus}' to '{$validated['status']}'.",
            ]);
        }

        $oldStatus = $booking->status;

        // Record downpayment when confirming
        if ($validated['status'] === 'confirmed' && $oldStatus !== 'confirmed') {
            Payment::create([
                'booking_id' => $booking->id,
                'type' => 'downpayment',
                'amount' => $validated['downpayment_amount'],
                'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Cash',
                'payment_status' => 'completed',
                'transaction_id' => 'ADM-'.strtoupper(Str::random(10)),
            ]);
        }

        // Record payment when transitioning from confirmed to active or completed
        if (in_array($validated['status'], ['active', 'completed']) && $oldStatus === 'confirmed') {
            if (! empty($validated['amount']) && (float) $validated['amount'] > 0) {
                $paymentType = $validated['status'] === 'completed' ? 'full_payment' : 'remaining';
                Payment::create([
                    'booking_id' => $booking->id,
                    'type' => $paymentType,
                    'amount' => $validated['amount'],
                    'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Cash',
                    'payment_status' => 'completed',
                    'transaction_id' => 'ADM-'.strtoupper(Str::random(10)),
                ]);
            }
        }

        // Record payment when transitioning from active to completed
        if ($validated['status'] === 'completed' && $oldStatus === 'active') {
            if (! empty($validated['amount']) && (float) $validated['amount'] > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'type' => 'full_payment',
                    'amount' => $validated['amount'],
                    'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Cash',
                    'payment_status' => 'completed',
                    'transaction_id' => 'ADM-'.strtoupper(Str::random(10)),
                ]);
            }
        }

        // If confirming a booking that used a coupon, check capacity and increment
        if ($validated['status'] === 'confirmed' && $oldStatus !== 'confirmed') {
            $usage = CouponUsage::where('booking_id', $booking->id)->first();
            if ($usage && $usage->coupon) {
                $coupon = $usage->coupon;
                if ($coupon->max_uses !== null && $coupon->user_count >= $coupon->max_uses) {
                    return redirect()->back()->withErrors([
                        'status' => "Cannot confirm — coupon {$coupon->code} has reached its usage limit.",
                    ]);
                }
                $coupon->increment('user_count');
            }
        }

        // If cancelling a confirmed booking that used a coupon, decrement
        if ($validated['status'] === 'cancelled' && $oldStatus === 'confirmed') {
            $usage = CouponUsage::where('booking_id', $booking->id)->first();
            if ($usage && $usage->coupon && $usage->coupon->user_count > 0) {
                $usage->coupon->decrement('user_count');
            }
        }

        // Record pickup handover (fuel + mileage) when the guest takes the car
        if ($validated['status'] === 'active' && $oldStatus === 'confirmed') {
            $driverService->save($booking, $validated);

            $pickupDamages = $validated['pickup_damages'] ?? [];
            foreach ($pickupDamages as $index => $damage) {
                $photo = $request->file("pickup_damages.{$index}.photo");
                if ($photo) {
                    $pickupDamages[$index]['photo'] = $photo->store('damage-photos', 'public');
                }
            }

            VehicleHandover::updateOrCreate(
                ['booking_id' => $booking->id, 'type' => 'pickup'],
                [
                    'fuel_level' => $validated['pickup_fuel'],
                    'odometer' => $validated['pickup_odometer'],
                    'notes' => $validated['pickup_notes'] ?? null,
                    'damages' => $pickupDamages,
                    'captured_by' => auth()->id(),
                    'captured_at' => now(),
                ]
            );
        }

        // Record return handover and apply fuel/mileage + extra charges when the guest returns the car
        if ($validated['status'] === 'completed' && $oldStatus === 'active' && $returnHandover) {
            $returnDamages = $validated['return_damages'] ?? [];
            foreach ($returnDamages as $index => $damage) {
                $photo = $request->file("return_damages.{$index}.photo");
                if ($photo) {
                    $returnDamages[$index]['photo'] = $photo->store('damage-photos', 'public');
                }
            }

            $returnHandover->notes = $validated['return_notes'] ?? null;
            $returnHandover->damages = $returnDamages;
            $returnHandover->captured_by = auth()->id();
            $returnHandover->captured_at = now();
            $returnHandover->save();

            $extraChargesResult = $extraChargeService->applyForReturn(
                $booking,
                $validated['extra_charges'] ?? [],
                $returnHandover,
            );

            $totalCharges = round((float) $handoverCharges['total'] + (float) $extraChargesResult['total'], 2);

            $booking->update([
                'handover_charges' => $handoverCharges,
                'total_amount' => round((float) $booking->total_amount + $totalCharges, 2),
            ]);

            if (! empty($extraChargesResult['charges'])) {
                AuditLog::create([
                    'user_id' => auth()->id(),
                    'action' => 'extra_charges_applied',
                    'model_type' => Booking::class,
                    'model_id' => $booking->id,
                    'description' => 'Extra charges applied at return for booking '.$booking->reference_code.': '.
                        collect($extraChargesResult['charges'])->map(fn ($c) => $c->name.' ($'.number_format((float) $c->amount + (float) $c->tax_amount, 2).')')->implode(', '),
                    'old_values' => ['total_amount' => round((float) $booking->total_amount - $totalCharges, 2)],
                    'new_values' => ['total_amount' => $booking->total_amount],
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
            }
        }

        $booking->update(['status' => $validated['status']]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'booking_status_updated',
            'model_type' => Booking::class,
            'model_id' => $booking->id,
            'description' => "Booking {$booking->reference_code} status changed from {$oldStatus} to {$validated['status']}",
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $validated['status']],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        try {
            event(new BookingUpdated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed: '.$e->getMessage());
        }

        // Send confirmation email when transitioning from pending to confirmed
        if ($validated['status'] === 'confirmed' && $oldStatus === 'pending') {
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

        // Send thank you email with review link when transitioning to completed
        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            try {
                $recipient = $booking->guest?->email ?? $booking->user?->email;
                if ($recipient) {
                    $booking->load(['guest', 'user', 'car']);
                    Mail::to($recipient)->queue(new BookingCompleted($booking));
                }
            } catch (\Throwable $e) {
                Log::warning('Thank you email failed for booking #'.$booking->id.': '.$e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Booking status updated successfully.');
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

        if ($booking->status === 'pending' && in_array($validated['type'], ['downpayment', 'full_payment'])) {
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
                    'amount' => "Refund \$".number_format(abs($validated['amount']), 2).' exceeds the refundable amount of $'.number_format(max(0, $refundable + $otherRefundsTotal), 2),
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
}
