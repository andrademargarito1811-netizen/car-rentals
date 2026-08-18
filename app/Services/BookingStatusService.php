<?php

namespace App\Services;

use App\Events\BookingUpdated;
use App\Exceptions\BookingStatusException;
use App\Mail\BookingCompleted;
use App\Mail\GuestBookingConfirmation;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Payment;
use App\Models\VehicleHandover;
use App\Notifications\BookingStatusChanged;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class BookingStatusService
{
    private const ALLOWED_TRANSITIONS = [
        'pending' => ['confirmed', 'cancelled'],
        'confirmed' => ['active', 'cancelled'],
        'active' => ['completed', 'cancelled'],
        'completed' => [],
        'cancelled' => [],
    ];

    public function __construct(
        private HandoverChargeCalculator $calculator,
        private CheckoutDriverService $driverService,
        private ExtraChargeService $extraChargeService,
        private EarlyReturnProrationService $prorationService,
    ) {}

    /**
     * Apply a status transition to a booking.
     *
     * All writes (payments, coupon counters, handovers, status, audit trail)
     * happen inside a single database transaction, so a mid-step failure rolls
     * the whole change back instead of leaving partially-applied state. Email
     * and broadcast side effects run only after the transaction commits.
     */
    public function transition(Request $request, Booking $booking): void
    {
        $currentStatus = $booking->status;

        // Completing a rental requires a pickup handover to compare against.
        $pickupHandover = $booking->pickupHandover;
        if ($currentStatus === 'active' && $request->input('status') === 'completed' && ! $pickupHandover) {
            throw new BookingStatusException('A pickup handover (fuel level and odometer at pickup) must be recorded before completing this booking.');
        }

        // Pending fuel/mileage + extra charges (and early-return proration) feed
        // the payment-amount rules.
        $pendingCharges = 0.0;
        $handoverCharges = null;
        $returnHandover = null;
        $proratedBase = null;
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $returnHandover = new VehicleHandover;
            $returnHandover->booking_id = $booking->id;
            $returnHandover->car_id = $booking->car_id;
            $returnHandover->type = 'return';
            $returnHandover->fuel_level = $request->input('return_fuel');
            $returnHandover->odometer = $request->input('return_odometer');
            if ($request->filled('returned_at')) {
                $returnHandover->returned_at = $request->input('returned_at');
            }

            $handoverCharges = $this->calculator->calculate($booking, $returnHandover);
            $extraChargesPreview = $this->extraChargeService->previewTotal($booking, $request->input('extra_charges', []));

            $proratedBase = $this->prorationService->proratedBase($booking, $returnHandover);
            $additions = (float) $handoverCharges['total'] + $extraChargesPreview;
            $prorationDelta = $proratedBase !== null
                ? round($proratedBase - (float) $booking->total_amount, 2)
                : 0.0;

            $pendingCharges = round($additions + $prorationDelta, 2);
        }

        $validated = $request->validate(
            $this->buildRules($request, $booking, $currentStatus, $pendingCharges, $pickupHandover)
        );

        if (! in_array($validated['status'], self::ALLOWED_TRANSITIONS[$currentStatus] ?? [], true)) {
            throw new BookingStatusException("Cannot transition from '{$currentStatus}' to '{$validated['status']}'.");
        }

        DB::transaction(function () use ($request, $booking, $validated, $currentStatus, $handoverCharges, $returnHandover, $proratedBase) {
            // Record downpayment when confirming.
            if ($validated['status'] === 'confirmed' && $currentStatus !== 'confirmed') {
                Payment::create([
                    'booking_id' => $booking->id,
                    'type' => 'downpayment',
                    'amount' => $validated['downpayment_amount'],
                    'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Cash',
                    'payment_status' => 'completed',
                    'transaction_id' => 'ADM-'.strtoupper(Str::random(10)),
                ]);
            }

            // Record payment when transitioning from confirmed to active/completed.
            if (in_array($validated['status'], ['active', 'completed']) && $currentStatus === 'confirmed') {
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

            // Record payment when transitioning from active to completed.
            if ($validated['status'] === 'completed' && $currentStatus === 'active') {
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

            // Coupon capacity check + atomic increment when confirming.
            if ($validated['status'] === 'confirmed' && $currentStatus !== 'confirmed') {
                $this->consumeCoupon($booking);
            }

            // Release the coupon slot when cancelling a confirmed booking.
            if ($validated['status'] === 'cancelled' && $currentStatus === 'confirmed') {
                $this->releaseCoupon($booking);
            }

            // Record pickup handover (fuel + mileage) when the guest takes the car.
            if ($validated['status'] === 'active' && $currentStatus === 'confirmed') {
                $this->recordPickupHandover($request, $booking, $validated);
            }

            // Record return handover and apply fuel/mileage + extra charges when the guest returns the car.
            if ($validated['status'] === 'completed' && $currentStatus === 'active' && $returnHandover) {
                $this->recordReturnHandover($request, $booking, $returnHandover, $validated, $handoverCharges, $proratedBase);
            }

            $booking->update(['status' => $validated['status']]);

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'booking_status_updated',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => "Booking {$booking->reference_code} status changed from {$currentStatus} to {$validated['status']}",
                'old_values' => ['status' => $currentStatus],
                'new_values' => ['status' => $validated['status']],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        });

        // Post-commit side effects — must not run inside the transaction so a
        // broadcast or mail failure can never roll back the status change.
        try {
            event(new BookingUpdated($booking));
        } catch (\Throwable $e) {
            Log::warning('Broadcast failed: '.$e->getMessage());
        }

        AdminNotificationService::send(
            new BookingStatusChanged($booking, $currentStatus, $validated['status']),
        );

        if ($validated['status'] === 'confirmed' && $currentStatus === 'pending') {
            $this->queueConfirmationEmail($booking);
        }

        if ($validated['status'] === 'completed' && $currentStatus !== 'completed') {
            $this->queueCompletionEmail($booking);
        }
    }

    private function buildRules(Request $request, Booking $booking, string $currentStatus, float $pendingCharges, ?VehicleHandover $pickupHandover): array
    {
        $rules = [
            'status' => 'required|in:confirmed,active,completed,cancelled',
        ];

        // Require downpayment amount when transitioning from pending to confirmed.
        if ($currentStatus === 'pending' && $request->input('status') === 'confirmed') {
            $rules['downpayment_amount'] = 'required|numeric|min:0.01|max:'.$booking->total_amount;
        }

        // Handover capture rules: fuel + mileage when the guest takes the car.
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
            $rules['driver_birth_date'] = ($requiresDriver ? 'required|' : 'nullable|').'date|before_or_equal:'.now()->subYears(18)->format('Y-m-d');
            $rules['license_number'] = $requiresDriver ? 'required|string|max:255' : 'nullable|string|max:255';
            $rules['license_category'] = $requiresDriver ? 'required|string|max:50' : 'nullable|string|max:50';
            $rules['license_expiry'] = ($requiresDriver ? 'required|' : 'nullable|').'date|after:today';
        }

        // Handover capture rules: fuel + mileage when the guest returns the car.
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $rules['return_fuel'] = 'required|integer|min:0|max:8';
            $rules['return_odometer'] = 'required|numeric|min:'.(float) $pickupHandover->odometer;
            $rules['return_notes'] = 'nullable|string|max:1000';
            $rules['returned_at'] = ['nullable', 'date', function ($attribute, $value, $fail) use ($pickupHandover) {
                if ($value && $pickupHandover?->captured_at && strtotime($value) < $pickupHandover->captured_at->getTimestamp()) {
                    $fail('The return date/time cannot be before the pickup time.');
                }
            }];
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

        // Amount rules for confirmed → active/completed transitions.
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

        // Amount rules for active → completed transitions (includes handover charges).
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $remaining = $booking->remainingBalance() + $pendingCharges;
            if ($remaining > 0) {
                $rules['amount'] = 'required|numeric|min:'.$remaining.'|max:'.$remaining;
            } else {
                $rules['amount'] = 'nullable|numeric|min:0';
            }
        }

        return $rules;
    }

    private function consumeCoupon(Booking $booking): void
    {
        $usage = CouponUsage::where('booking_id', $booking->id)->first();
        if (! $usage || ! $usage->coupon) {
            return;
        }

        // Lock the row for the duration of the transaction so two concurrent
        // confirms cannot both pass the capacity check and over-consume.
        $coupon = Coupon::whereKey($usage->coupon_id)->lockForUpdate()->first();
        if (! $coupon) {
            return;
        }

        if ($coupon->max_uses !== null && (int) $coupon->user_count >= (int) $coupon->max_uses) {
            throw new BookingStatusException("Cannot confirm — coupon {$coupon->code} has reached its usage limit.");
        }

        $coupon->increment('user_count');
    }

    private function releaseCoupon(Booking $booking): void
    {
        $usage = CouponUsage::where('booking_id', $booking->id)->first();
        if (! $usage || ! $usage->coupon) {
            return;
        }

        $coupon = Coupon::whereKey($usage->coupon_id)->lockForUpdate()->first();
        if ($coupon && (int) $coupon->user_count > 0) {
            $coupon->decrement('user_count');
        }
    }

    private function recordPickupHandover(Request $request, Booking $booking, array $validated): void
    {
        $this->driverService->save($booking, $validated);

        $pickupDamages = $validated['pickup_damages'] ?? [];
        foreach ($pickupDamages as $index => $damage) {
            $photo = $request->file("pickup_damages.{$index}.photo");
            if ($photo) {
                $pickupDamages[$index]['photo'] = $photo->store('damage-photos', 'public');
            }
            // Damage found at pickup pre-dates the rental, so it is not the
            // renter's liability.
            $pickupDamages[$index]['preexisting'] = true;
        }

        VehicleHandover::updateOrCreate(
            ['booking_id' => $booking->id, 'type' => 'pickup'],
            [
                'car_id' => $booking->car_id,
                'fuel_level' => $validated['pickup_fuel'],
                'odometer' => $validated['pickup_odometer'],
                'notes' => $validated['pickup_notes'] ?? null,
                'damages' => $pickupDamages,
                'captured_by' => auth()->id(),
                'captured_at' => now(),
            ]
        );
    }

    private function recordReturnHandover(Request $request, Booking $booking, VehicleHandover $returnHandover, array $validated, array $handoverCharges, ?float $proratedBase): void
    {
        $returnDamages = $validated['return_damages'] ?? [];
        foreach ($returnDamages as $index => $damage) {
            $photo = $request->file("return_damages.{$index}.photo");
            if ($photo) {
                $returnDamages[$index]['photo'] = $photo->store('damage-photos', 'public');
            }
            // Marks recorded at return are newly-found and therefore chargeable.
            $returnDamages[$index]['preexisting'] = false;
        }

        $returnHandover->notes = $validated['return_notes'] ?? null;
        $returnHandover->damages = $returnDamages;
        $returnHandover->returned_at = $validated['returned_at'] ?? null;
        $returnHandover->captured_by = auth()->id();
        $returnHandover->captured_at = now();
        $returnHandover->save();

        $extraChargesResult = $this->extraChargeService->applyForReturn(
            $booking,
            $validated['extra_charges'] ?? [],
            $returnHandover,
        );

        $totalCharges = round((float) $handoverCharges['total'] + (float) $extraChargesResult['total'], 2);

        $base = $proratedBase !== null ? $proratedBase : (float) $booking->total_amount;
        $newTotal = round($base + $totalCharges, 2);

        $booking->update([
            'handover_charges' => $handoverCharges,
            'total_amount' => $newTotal,
        ]);

        $this->refundOverpayment($booking, $request);

        if (! empty($extraChargesResult['charges'])) {
            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'extra_charges_applied',
                'model_type' => Booking::class,
                'model_id' => $booking->id,
                'description' => 'Extra charges applied at return for booking '.$booking->reference_code.': '.
                    collect($extraChargesResult['charges'])->map(fn ($c) => $c->name.' ($'.number_format((float) $c->amount + (float) $c->tax_amount, 2).')')->implode(', '),
                'old_values' => ['total_amount' => round($base, 2)],
                'new_values' => ['total_amount' => $booking->total_amount],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }
    }

    /**
     * When proration lowers the total below what has already been collected,
     * record the difference as a completed refund so the booking settles to the
     * prorated amount without staff intervention.
     */
    private function refundOverpayment(Booking $booking, Request $request): void
    {
        $paid = round((float) $booking->totalPaid(), 2);
        $overpaid = round($paid - (float) $booking->total_amount, 2);

        if ($overpaid <= 0) {
            return;
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => 'refund',
            'amount' => -$overpaid,
            'payment_method' => 'Adjustment',
            'payment_status' => 'completed',
            'transaction_id' => 'ADJ-'.strtoupper(Str::random(10)),
            'metadata' => [
                'reason' => 'early_return_proration',
                'source' => 'auto',
            ],
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'refund_recorded',
            'model_type' => Payment::class,
            'model_id' => $payment->id,
            'description' => "Early return proration for booking {$booking->reference_code} — refund of \$".number_format($overpaid, 2).' recorded',
            'old_values' => [],
            'new_values' => ['amount' => -$overpaid, 'reason' => 'early_return_proration'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    private function queueConfirmationEmail(Booking $booking): void
    {
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

    private function queueCompletionEmail(Booking $booking): void
    {
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
}
