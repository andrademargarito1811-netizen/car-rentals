<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Car;
use App\Models\Payment;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StripePaymentController extends Controller
{
    public function __construct(
        private StripeService $stripe
    ) {}

    public function createPaymentIntent(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|integer|exists:bookings,id',
        ]);

        $booking = Booking::with('car')->findOrFail($validated['booking_id']);

        if ($booking->payment && $booking->payment->isCompleted()) {
            return response()->json([
                'error' => 'This booking has already been paid.',
            ], 409);
        }

        $amountInCents = (int) round($booking->total_amount * 100);
        if ($amountInCents < 50) {
            return response()->json([
                'error' => 'Amount must be at least $0.50.',
            ], 422);
        }

        $description = sprintf(
            'Car rental: %s %s (%s) — %s',
            $booking->car->brand,
            $booking->car->model,
            $booking->car->license_plate,
            $booking->reference_code ?? "Booking #{$booking->id}"
        );

        try {
            $intent = $this->stripe->createPaymentIntent([
                'amount' => $amountInCents,
                'metadata' => [
                    'booking_id' => (string) $booking->id,
                    'reference_code' => $booking->reference_code ?? '',
                ],
                'description' => $description,
            ]);

            DB::transaction(function () use ($booking, $intent) {
                Payment::updateOrCreate(
                    ['booking_id' => $booking->id],
                    [
                        'amount' => $booking->total_amount,
                        'payment_method' => 'stripe',
                        'payment_status' => 'pending',
                        'transaction_id' => $intent->id,
                        'metadata' => [
                            'stripe_payment_intent_id' => $intent->id,
                            'stripe_client_secret' => $intent->client_secret,
                            'status' => $intent->status,
                        ],
                    ]
                );
            });

            return response()->json([
                'client_secret' => $intent->client_secret,
                'payment_intent_id' => $intent->id,
                'amount' => $booking->total_amount,
            ]);
        } catch (\Exception $e) {
            $stripeError = $e instanceof \Stripe\Exception\ApiErrorException
                ? $e->getError()->message ?? $e->getMessage()
                : $e->getMessage();

            Log::error('Stripe PaymentIntent creation failed', [
                'booking_id' => $booking->id,
                'error' => $stripeError,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => $stripeError,
            ], 500);
        }
    }

    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        $event = $this->stripe->constructWebhookEvent($payload, $sigHeader);

        if (!$event) {
            return response()->json(['error' => 'Invalid webhook signature'], 400);
        }

        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handlePaymentIntentSucceeded($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handlePaymentIntentFailed($event->data->object);
                break;

            case 'payment_intent.canceled':
                $this->handlePaymentIntentCanceled($event->data->object);
                break;
        }

        return response()->json(['received' => true]);
    }

    private function handlePaymentIntentSucceeded(\Stripe\PaymentIntent $intent): void
    {
        $bookingId = $intent->metadata->booking_id ?? null;
        if (!$bookingId) {
            Log::warning('Stripe webhook: missing booking_id in metadata', ['intent_id' => $intent->id]);
            return;
        }

        DB::transaction(function () use ($bookingId, $intent) {
            $payment = Payment::where('booking_id', $bookingId)->first();
            if (!$payment) {
                Log::warning('Stripe webhook: payment record not found', ['booking_id' => $bookingId]);
                return;
            }

            $payment->update([
                'payment_status' => 'completed',
                'transaction_id' => $intent->id,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'stripe_status' => $intent->status,
                    'payment_method_details' => json_encode($intent->charges->data[0]->payment_method_details ?? null),
                ]),
            ]);

            if ($intent->charges->data[0]->payment_method_details->card->last4 ?? null) {
                $payment->update([
                    'card_last_four' => $intent->charges->data[0]->payment_method_details->card->last4,
                ]);
            }

            $booking = $payment->booking;
            if ($booking && $booking->status === 'pending') {
                $booking->update(['status' => 'confirmed']);
            }
        });
    }

    private function handlePaymentIntentFailed(\Stripe\PaymentIntent $intent): void
    {
        $bookingId = $intent->metadata->booking_id ?? null;
        if (!$bookingId) return;

        $payment = Payment::where('booking_id', $bookingId)->first();
        if (!$payment) return;

        $meta = $payment->metadata ?? [];
        $meta['stripe_status'] = $intent->status;
        $payment->update([
            'payment_status' => 'failed',
            'metadata' => $meta,
        ]);
    }

    private function handlePaymentIntentCanceled(\Stripe\PaymentIntent $intent): void
    {
        $bookingId = $intent->metadata->booking_id ?? null;
        if (!$bookingId) return;

        $payment = Payment::where('booking_id', $bookingId)->first();
        if (!$payment) return;

        $meta = $payment->metadata ?? [];
        $meta['stripe_status'] = $intent->status;
        $payment->update([
            'payment_status' => 'cancelled',
            'metadata' => $meta,
        ]);
    }
}
