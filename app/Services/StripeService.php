<?php

namespace App\Services;

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Exception\ApiErrorException;
use Illuminate\Support\Facades\Log;

class StripeService
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function createPaymentIntent(array $params): PaymentIntent
    {
        $defaults = [
            'currency' => 'usd',
            'automatic_payment_methods' => ['enabled' => true],
        ];

        return PaymentIntent::create(array_merge($defaults, $params));
    }

    public function retrievePaymentIntent(string $id): ?PaymentIntent
    {
        try {
            return PaymentIntent::retrieve($id);
        } catch (ApiErrorException $e) {
            Log::error('Stripe retrieve failed', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    public function confirmPaymentIntent(string $id): ?PaymentIntent
    {
        try {
            $intent = PaymentIntent::retrieve($id);
            if ($intent->status === 'requires_confirmation') {
                return $intent->confirm();
            }
            return $intent;
        } catch (ApiErrorException $e) {
            Log::error('Stripe confirm failed', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    public function cancelPaymentIntent(string $id): ?PaymentIntent
    {
        try {
            $intent = PaymentIntent::retrieve($id);
            if (!$intent->isCancelable()) {
                return $intent;
            }
            return $intent->cancel();
        } catch (ApiErrorException $e) {
            Log::error('Stripe cancel failed', ['id' => $id, 'error' => $e->getMessage()]);
            return null;
        }
    }

    public function constructWebhookEvent(string $payload, string $sigHeader): ?\Stripe\Event
    {
        $webhookSecret = config('services.stripe.webhook_secret');
        if (empty($webhookSecret)) {
            Log::warning('Stripe webhook secret not configured');
            return null;
        }

        try {
            return \Stripe\Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            Log::error('Stripe webhook: invalid payload', ['error' => $e->getMessage()]);
            return null;
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            Log::error('Stripe webhook: invalid signature', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
