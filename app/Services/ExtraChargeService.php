<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingExtraCharge;
use App\Models\ExtraCharge;
use App\Models\VehicleHandover;

class ExtraChargeService
{
    /**
     * Compute the total amount for a single catalog charge against a booking.
     *
     * @param  float|null  $rateOverride  rate entered by staff at return; falls back to the catalog rate
     * @return array{ rate: float, amount: float, tax: float, total: float }
     */
    public function computeAmount(ExtraCharge $charge, Booking $booking, ?float $rateOverride = null): array
    {
        $days = $this->billingDays($booking);
        $dailyRate = (float) ($booking->car?->daily_rate ?? 0);
        $subtotal = round($dailyRate * $days, 2);

        $rate = $rateOverride ?? (float) $charge->rate;

        if ($charge->value_in === 'Percentage') {
            $amount = $charge->calculation === 'Per Day'
                ? round(($dailyRate * $rate / 100) * $days, 2)
                : round($subtotal * $rate / 100, 2);
        } else {
            $amount = $charge->calculation === 'Per Day'
                ? round($rate * $days, 2)
                : round($rate, 2);
        }

        $tax = $charge->taxable ? $this->computeTaxOn($booking, $amount) : 0.0;

        return [
            'rate' => $rate,
            'amount' => $amount,
            'tax' => $tax,
            'total' => round($amount + $tax, 2),
        ];
    }

    /**
     * Additional tax owed when a taxable extra charge is added at return.
     * Only percentage, per-rental (add) taxes scale with the charge amount.
     */
    public function computeTaxOn(Booking $booking, float $chargeAmount): float
    {
        $tax = 0.0;

        $booking->loadMissing('bookingTaxes.tax');

        foreach ($booking->bookingTaxes as $bookingTax) {
            if (! $bookingTax->add_or_minus) {
                continue;
            }
            $taxRate = $bookingTax->tax;
            if (! $taxRate || $taxRate->value_in !== 'Percentage' || $taxRate->calculation !== 'Per Rental') {
                continue;
            }
            $tax += $chargeAmount * (float) $taxRate->rate / 100;
        }

        return round($tax, 2);
    }

    /**
     * Preview the grand total (incl. tax) for selected charges without persisting.
     *
     * @param  array<int, int|array{id: int, rate?: string|float}>  $selected
     */
    public function previewTotal(Booking $booking, array $selected): float
    {
        $total = 0.0;

        foreach ($this->resolve($booking, $selected) as $entry) {
            $total += $entry['charge']->operator === '+' ? $entry['total'] : -$entry['total'];
        }

        return round($total, 2);
    }

    /**
     * Persist selected extra charges against a booking's return handover.
     *
     * @param  array<int, int|array{id: int, rate?: string|float}>  $selected  list of extra_charge ids (optionally with an override rate)
     * @return array{ charges: array, total: float } applied rows + grand total (incl. tax)
     */
    public function applyForReturn(Booking $booking, array $selected, VehicleHandover $returnHandover): array
    {
        $rows = [];
        $total = 0.0;

        foreach ($this->resolve($booking, $selected) as $entry) {
            $charge = $entry['charge'];

            $row = BookingExtraCharge::create([
                'booking_id' => $booking->id,
                'extra_charge_id' => $charge->id,
                'handover_id' => $returnHandover->id,
                'name' => $charge->name,
                'rate' => $entry['rate'],
                'value_in' => $charge->value_in,
                'calculation' => $charge->calculation,
                'operator' => $charge->operator,
                'taxable' => $charge->taxable,
                'amount' => $entry['amount'],
                'tax_amount' => $entry['tax'],
                'source' => 'return',
            ]);

            $rows[] = $row;
            $total += $charge->operator === '+' ? $entry['total'] : -$entry['total'];
        }

        return [
            'charges' => $rows,
            'total' => round($total, 2),
        ];
    }

    /**
     * Resolve selected ids against the active catalog and compute each amount.
     *
     * @param  array<int, int|array{id: int, rate?: string|float}>  $selected
     * @return array<int, array{charge: ExtraCharge, rate: float, amount: float, tax: float, total: float}>
     */
    protected function resolve(Booking $booking, array $selected): array
    {
        $entries = [];

        foreach ($selected as $item) {
            $id = is_array($item) ? ($item['id'] ?? null) : $item;
            if (! $id) {
                continue;
            }

            $charge = ExtraCharge::where('is_active', true)->find($id);
            if (! $charge) {
                continue;
            }

            $rateOverride = null;
            if (is_array($item) && array_key_exists('rate', $item)) {
                $rateOverride = $item['rate'] !== '' && $item['rate'] !== null ? (float) $item['rate'] : null;
            }

            $computed = $this->computeAmount($charge, $booking, $rateOverride);

            $entries[] = [
                'charge' => $charge,
                'rate' => $computed['rate'],
                'amount' => $computed['amount'],
                'tax' => $computed['tax'],
                'total' => $computed['total'],
            ];
        }

        return $entries;
    }

    protected function billingDays(Booking $booking): int
    {
        return RentalDayCalculator::days(
            $booking->start_date->toDateString(),
            $booking->pickup_time,
            $booking->end_date->toDateString(),
            $booking->return_time,
        );
    }
}
