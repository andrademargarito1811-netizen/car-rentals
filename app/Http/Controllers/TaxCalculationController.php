<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Services\TaxCalculationService;
use Illuminate\Http\Request;

class TaxCalculationController extends Controller
{
    public function __construct(
        protected TaxCalculationService $taxService
    ) {}

    public function calculate(Request $request)
    {
        $validated = $request->validate([
            'car_id' => 'required|exists:tblcars,id',
            'pickup_location' => 'nullable|string|max:255',
            'billing_days' => 'required|integer|min:1',
            'daily_rate' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
        ]);

        $result = $this->taxService->calculateForCar(
            (int) $validated['car_id'],
            $validated['pickup_location'] ?? null,
            (int) $validated['billing_days'],
            (float) $validated['daily_rate'],
            (float) $validated['subtotal'],
        );

        return response()->json($result);
    }
}
