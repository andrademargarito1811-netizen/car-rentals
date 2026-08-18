<?php

namespace App\Services;

use App\Models\Coupon;

class CouponDiscountService
{
    /**
     * Validate a coupon code against the booking inputs and compute the discount.
     *
     * @return array{valid: bool, message: ?string, coupon: ?Coupon, type: ?string, value: ?float, discount: ?float, label: ?string}
     */
    public function discount(?string $code, float $subtotal, int $billingDays, float $dailyRate): array
    {
        if (empty($code)) {
            return $this->invalid('Coupon code not found.');
        }

        $coupon = Coupon::with('couponType')
            ->where('code', strtoupper(trim($code)))
            ->first();

        if (! $coupon) {
            return $this->invalid('Coupon code not found.');
        }

        if (! $coupon->is_active) {
            return $this->invalid('This coupon is no longer active.');
        }

        if ($coupon->start_date && $coupon->end_date) {
            $today = now()->startOfDay();
            if ($today->lt($coupon->start_date) || $today->gt($coupon->end_date)) {
                return $this->invalid('This coupon has expired or is not yet valid.');
            }
        }

        if ($coupon->max_uses !== null && $coupon->user_count >= $coupon->max_uses) {
            return $this->invalid('This coupon has reached its usage limit.');
        }

        if ($coupon->min_order !== null && $subtotal < (float) $coupon->min_order) {
            return $this->invalid('Minimum order amount of $'.number_format((float) $coupon->min_order, 2).' required.');
        }

        $typeName = $coupon->couponType?->name ?? 'Amount';
        $minRate = (float) ($coupon->min_rate ?? 0);
        $type = 'fixed';
        $label = '';
        $discount = 0.0;

        switch ($typeName) {
            case 'Percentage':
                $type = 'percent';
                $discount = round(min($subtotal * $minRate / 100, $subtotal), 2);
                $label = $minRate.'% off';
                break;

            case 'Amount':
                $type = 'fixed';
                $discount = round(min($minRate, $subtotal), 2);
                $label = '$'.number_format($minRate, 2).' off';
                break;

            case 'Per Day':
                $type = 'per_day';
                $discount = round(min($minRate * $billingDays, $subtotal), 2);
                $label = '$'.number_format($minRate, 2).' off per day';
                break;

            case 'Day Free':
                $type = 'day_free';
                $discount = round(min((int) $minRate, $billingDays) * $dailyRate, 2);
                $label = (int) $minRate.' day(s) free';
                break;

            default:
                return $this->invalid('Unsupported coupon type.');
        }

        return [
            'valid' => true,
            'message' => null,
            'coupon' => $coupon,
            'type' => $type,
            'value' => $minRate,
            'discount' => $discount,
            'label' => $label,
        ];
    }

    private function invalid(string $message): array
    {
        return [
            'valid' => false,
            'message' => $message,
            'coupon' => null,
            'type' => null,
            'value' => null,
            'discount' => null,
            'label' => null,
        ];
    }
}
