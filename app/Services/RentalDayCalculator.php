<?php

namespace App\Services;

use Illuminate\Support\Carbon;

class RentalDayCalculator
{
    public const DEFAULT_PICKUP_TIME = '00:00:00';

    public const DEFAULT_RETURN_TIME = '23:59:59';

    /**
     * Number of billable days for a rental window.
     *
     * Billable days = ceil(rental hours / 24), minimum 1. When a pickup or
     * return time is missing the window defaults to the full day (00:00:00 /
     * 23:59:59) so a date-only rental is billed calendar-days-inclusive.
     */
    public static function days(string $pickupDate, ?string $pickupTime, string $returnDate, ?string $returnTime): int
    {
        $pickup = Carbon::parse($pickupDate.' '.($pickupTime ?: self::DEFAULT_PICKUP_TIME));
        $return = Carbon::parse($returnDate.' '.($returnTime ?: self::DEFAULT_RETURN_TIME));

        return max(1, (int) ceil($pickup->diffInSeconds($return, true) / 86400));
    }
}
