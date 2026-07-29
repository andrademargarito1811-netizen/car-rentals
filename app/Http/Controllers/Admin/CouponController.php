<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CouponController extends Controller
{
    public function index()
    {
        $coupons = Coupon::with('couponType')
            ->latest()
            ->paginate(10);

        $couponTypes = CouponType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $coupons,
            'couponTypes' => $couponTypes,
        ]);
    }

    public function create()
    {
        $couponTypes = CouponType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Coupons/Create', [
            'couponTypes' => $couponTypes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'issued_by' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'min_order' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'coupon_type_id' => 'required|exists:coupon_types,id',
            'min_rate' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        Coupon::create($validated);

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon created successfully.');
    }

    public function edit(Coupon $coupon)
    {
        $couponTypes = CouponType::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Coupons/Edit', [
            'coupon' => $coupon->load('couponType'),
            'couponTypes' => $couponTypes,
        ]);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'issued_by' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'min_order' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'coupon_type_id' => 'required|exists:coupon_types,id',
            'min_rate' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $coupon->update($validated);

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon updated successfully.');
    }

    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return redirect()->route('admin.coupons.index')->with('success', 'Coupon deleted successfully.');
    }
}
