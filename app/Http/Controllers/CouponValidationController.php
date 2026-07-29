<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\CouponType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CouponValidationController extends Controller
{
    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20',
            'subtotal' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'billing_days' => 'nullable|integer|min:1',
        ]);

        $code = strtoupper(trim($request->input('code')));
        $subtotal = (float) ($request->input('subtotal', 0));
        $dailyRate = (float) ($request->input('daily_rate', 0));
        $billingDays = (int) ($request->input('billing_days', 1));

        $coupon = Coupon::with('couponType')->where('code', $code)->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => 'Coupon code not found.',
            ]);
        }

        // Check if active
        if (!$coupon->is_active) {
            return response()->json([
                'valid' => false,
                'message' => 'This coupon is no longer active.',
            ]);
        }

        // Check date range (skip if no dates set)
        if ($coupon->start_date && $coupon->end_date) {
            $today = now()->startOfDay();
            if ($today->lt($coupon->start_date) || $today->gt($coupon->end_date)) {
                return response()->json([
                    'valid' => false,
                    'message' => 'This coupon has expired or is not yet valid.',
                ]);
            }
        }

        // Check max uses
        if ($coupon->max_uses !== null && $coupon->user_count >= $coupon->max_uses) {
            return response()->json([
                'valid' => false,
                'message' => 'This coupon has reached its usage limit.',
            ]);
        }

        // Check min order amount
        if ($coupon->min_order !== null && $subtotal < (float) $coupon->min_order) {
            return response()->json([
                'valid' => false,
                'message' => 'Minimum order amount of $' . number_format((float) $coupon->min_order, 2) . ' required.',
            ]);
        }

        // Determine discount type and compute value
        $typeName = $coupon->couponType->name ?? 'Amount';
        $minRate = (float) ($coupon->min_rate ?? 0);

        $discountType = 'fixed';
        $discountValue = $minRate;
        $discountLabel = '';

        switch ($typeName) {
            case 'Percentage':
                $discountType = 'percent';
                $discountValue = $minRate;
                $discountLabel = $minRate . '% off';
                break;

            case 'Amount':
                $discountType = 'fixed';
                $discountValue = $minRate;
                $discountLabel = '$' . number_format($minRate, 2) . ' off';
                break;

            case 'Per Day':
                $discountType = 'per_day';
                $discountValue = $minRate;
                $discountLabel = '$' . number_format($minRate, 2) . ' off per day';
                break;

            case 'Day Free':
                $discountType = 'day_free';
                $discountValue = (int) $minRate;
                $discountLabel = (int) $minRate . ' day(s) free';
                break;
        }

        return response()->json([
            'valid' => true,
            'coupon' => [
                'code' => $coupon->code,
                'type' => $discountType,
                'value' => $discountValue,
                'label' => $discountLabel,
                'min_rate' => $minRate,
            ],
        ]);
    }
}
