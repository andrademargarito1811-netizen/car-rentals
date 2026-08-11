<?php

namespace App\Http\Controllers;

use App\Services\CouponDiscountService;
use Illuminate\Http\Request;

class CouponValidationController extends Controller
{
    public function __construct(
        private CouponDiscountService $couponService,
    ) {}

    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:20',
            'subtotal' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'billing_days' => 'nullable|integer|min:1',
        ]);

        $subtotal = (float) ($request->input('subtotal', 0));
        $dailyRate = (float) ($request->input('daily_rate', 0));
        $billingDays = (int) ($request->input('billing_days', 1));

        $result = $this->couponService->discount($request->input('code'), $subtotal, $billingDays, $dailyRate);

        if (! $result['valid']) {
            return response()->json([
                'valid' => false,
                'message' => $result['message'],
            ]);
        }

        return response()->json([
            'valid' => true,
            'coupon' => [
                'code' => $result['coupon']->code,
                'type' => $result['type'],
                'value' => $result['value'],
                'label' => $result['label'],
                'min_rate' => $result['value'],
            ],
        ]);
    }
}
