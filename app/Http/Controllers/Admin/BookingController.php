<?php

namespace App\Http\Controllers\Admin;

use App\Events\BookingUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\ModifyBookingRequest;
use App\Mail\BookingCompleted;
use App\Mail\GuestBookingConfirmation;
use App\Models\Booking;
use App\Models\Car;
use App\Models\Payment;
use App\Models\AuditLog;
use App\Models\CouponUsage;
use App\Models\VehicleLocation;
use App\Services\BookingModificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::with(['user', 'guest', 'car']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->where('start_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('end_date', '<=', $request->date_to);
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Admin/Bookings/Index', [
            'bookings' => $bookings,
            'filters' => $request->only(['status', 'date_from', 'date_to']),
        ]);
    }

    public function show(Booking $booking)
    {
        $booking->load(['user', 'guest', 'car', 'payment', 'payments']);

        return Inertia::render('Admin/Bookings/Show', [
            'booking' => $booking,
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

        $newStart = $validated['start_date'] . ' ' . ($booking->pickup_time ?? '00:00:00');
        $newEnd = $validated['end_date'] . ' ' . ($booking->return_time ?? '23:59:59');
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
            \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Booking rescheduled successfully.');
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $rules = [
            'status' => 'required|in:confirmed,active,completed,cancelled',
        ];

        $currentStatus = $booking->status;

        // Require downpayment amount when transitioning from pending to confirmed
        if ($currentStatus === 'pending' && $request->input('status') === 'confirmed') {
            $rules['downpayment_amount'] = 'required|numeric|min:0.01|max:' . $booking->total_amount;
        }

        // Amount rules for confirmed → active/completed transitions
        if ($currentStatus === 'confirmed') {
            if ($request->input('status') === 'completed') {
                $remaining = $booking->remainingBalance();
                if ($remaining > 0) {
                    $rules['amount'] = 'required|numeric|min:' . $remaining . '|max:' . $remaining;
                } else {
                    $rules['amount'] = 'nullable|numeric|min:0';
                }
            } elseif ($request->input('status') === 'active') {
                $remaining = $booking->remainingBalance();
                $rules['amount'] = 'nullable|numeric|min:0' . ($remaining > 0 ? '|max:' . $remaining : '');
            }
        }

        // Amount rules for active → completed transitions
        if ($currentStatus === 'active' && $request->input('status') === 'completed') {
            $remaining = $booking->remainingBalance();
            if ($remaining > 0) {
                $rules['amount'] = 'required|numeric|min:' . $remaining . '|max:' . $remaining;
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

        if (!in_array($validated['status'], $allowedTransitions[$currentStatus] ?? [])) {
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
                'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Manual',
                'payment_status' => 'completed',
                'transaction_id' => 'ADM-' . strtoupper(Str::random(10)),
            ]);
        }

        // Record payment when transitioning from confirmed to active or completed
        if (in_array($validated['status'], ['active', 'completed']) && $oldStatus === 'confirmed') {
            if (!empty($validated['amount']) && (float)$validated['amount'] > 0) {
                $paymentType = $validated['status'] === 'completed' ? 'full_payment' : 'remaining';
                Payment::create([
                    'booking_id' => $booking->id,
                    'type' => $paymentType,
                    'amount' => $validated['amount'],
                    'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Manual',
                    'payment_status' => 'completed',
                    'transaction_id' => 'ADM-' . strtoupper(Str::random(10)),
                ]);
            }
        }

        // Record payment when transitioning from active to completed
        if ($validated['status'] === 'completed' && $oldStatus === 'active') {
            if (!empty($validated['amount']) && (float)$validated['amount'] > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'type' => 'full_payment',
                    'amount' => $validated['amount'],
                    'payment_method' => $request->filled('payment_method') ? $request->input('payment_method') : 'Manual',
                    'payment_status' => 'completed',
                    'transaction_id' => 'ADM-' . strtoupper(Str::random(10)),
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
            Log::warning('Broadcast failed: ' . $e->getMessage());
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
                Log::warning('Confirmation email failed for booking #' . $booking->id . ': ' . $e->getMessage());
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
                Log::warning('Thank you email failed for booking #' . $booking->id . ': ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Booking status updated successfully.');
    }

    public function recordPayment(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|max:50',
            'transaction_id' => 'nullable|string|max:255',
            'type' => 'required|in:downpayment,remaining,full_payment',
        ]);

        $remaining = $booking->remainingBalance();
        if ($remaining <= 0) {
            return redirect()->back()->withErrors([
                'amount' => 'This booking is already fully paid.',
            ]);
        }

        if ($validated['amount'] > $remaining) {
            return redirect()->back()->withErrors([
                'amount' => "Amount \${$validated['amount']} exceeds remaining balance of \$" . number_format($remaining, 2),
            ]);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'] ?? 'ADM-' . strtoupper(Str::random(10)),
            'payment_status' => 'completed',
        ]);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'payment_recorded',
            'model_type' => Payment::class,
            'model_id' => $payment->id,
            'description' => "Payment of \${$validated['amount']} ({$validated['type']}) recorded for booking {$booking->reference_code}",
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
                Log::warning('Confirmation email failed for booking #' . $booking->id . ': ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    public function updatePayment(Request $request, Booking $booking, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|max:50',
            'transaction_id' => 'nullable|string|max:255',
        ]);

        // Prevent editing payments on fully paid bookings
        if ($booking->remainingBalance() <= 0) {
            return redirect()->back()->withErrors([
                'amount' => 'Cannot edit payments on a fully paid booking.',
            ]);
        }

        // Prevent overpayment: total paid (excluding this payment) + new amount must not exceed total_amount
        $otherPaymentsTotal = (float) $booking->completedPayments()
            ->where('payments.id', '!=', $payment->id)
            ->sum('amount');
        $newTotalPaid = $otherPaymentsTotal + (float) $validated['amount'];
        if ($newTotalPaid > (float) $booking->total_amount) {
            return redirect()->back()->withErrors([
                'amount' => "Amount \${$validated['amount']} would make total paid (\$" . number_format($newTotalPaid, 2) . ') exceed the booking total of $' . number_format($booking->total_amount, 2),
            ]);
        }

        $oldAmount = $payment->amount;

        $payment->update($validated);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'payment_updated',
            'model_type' => Payment::class,
            'model_id' => $payment->id,
            'description' => "Payment #{$payment->id} for booking {$booking->reference_code} updated from \$" . number_format($oldAmount, 2) . ' to $' . number_format($validated['amount'], 2),
            'old_values' => ['amount' => $oldAmount],
            'new_values' => $validated,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return redirect()->back()->with('success', 'Payment updated successfully.');
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
                \Illuminate\Support\Facades\Log::warning('Broadcast failed: ' . $e->getMessage());
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
