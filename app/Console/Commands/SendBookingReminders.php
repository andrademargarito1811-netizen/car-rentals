<?php

namespace App\Console\Commands;

use App\Mail\OverdueReturnNotice;
use App\Mail\UpcomingPickupReminder;
use App\Mail\UpcomingReturnReminder;
use App\Models\Booking;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendBookingReminders extends Command
{
    protected $signature = 'bookings:send-reminders';

    protected $description = 'Send upcoming pickup/return reminders and overdue return notices';

    public function handle(): int
    {
        $today = today();
        $lookahead = (int) config('reservation.reminder_lookahead_days', 1);
        $target = $today->copy()->addDays($lookahead)->startOfDay();

        $pickupSent = $this->sendPickupReminders($today, $target);
        $returnSent = $this->sendReturnReminders($today, $target);
        $overdueSent = $this->sendOverdueNotices($today);

        $this->info("Sent {$pickupSent} pickup reminder(s), {$returnSent} return reminder(s), {$overdueSent} overdue notice(s).");

        return self::SUCCESS;
    }

    protected function sendPickupReminders(Carbon $today, Carbon $target): int
    {
        $bookings = Booking::with(['guest', 'user', 'car', 'pickupLocation', 'returnLocation'])
            ->whereDate('start_date', $target->toDateString())
            ->whereIn('status', ['confirmed', 'active'])
            ->get();

        $sent = 0;

        foreach ($bookings as $booking) {
            if ($booking->reminderSent('pickup', $target->toDateString())) {
                continue;
            }

            $email = $booking->guest?->email ?? $booking->user?->email;
            if (! $email) {
                continue;
            }

            try {
                Mail::to($email)->queue(new UpcomingPickupReminder($booking));
                $booking->markReminderSent('pickup', $target->toDateString());
                $sent++;
            } catch (\Throwable $e) {
                Log::warning("Pickup reminder email failed for booking #{$booking->id}: ".$e->getMessage());
            }
        }

        return $sent;
    }

    protected function sendReturnReminders(Carbon $today, Carbon $target): int
    {
        $bookings = Booking::with(['guest', 'user', 'car', 'pickupLocation', 'returnLocation'])
            ->whereDate('end_date', $target->toDateString())
            ->whereIn('status', ['confirmed', 'active'])
            ->get();

        $sent = 0;

        foreach ($bookings as $booking) {
            if ($booking->reminderSent('return', $target->toDateString())) {
                continue;
            }

            $email = $booking->guest?->email ?? $booking->user?->email;
            if (! $email) {
                continue;
            }

            try {
                Mail::to($email)->queue(new UpcomingReturnReminder($booking));
                $booking->markReminderSent('return', $target->toDateString());
                $sent++;
            } catch (\Throwable $e) {
                Log::warning("Return reminder email failed for booking #{$booking->id}: ".$e->getMessage());
            }
        }

        return $sent;
    }

    protected function sendOverdueNotices(Carbon $today): int
    {
        $bookings = Booking::with(['guest', 'user', 'car', 'pickupLocation', 'returnLocation'])
            ->where('status', 'active')
            ->whereDate('end_date', '<', $today)
            ->get();

        $sent = 0;

        foreach ($bookings as $booking) {
            if ($booking->reminderSent('overdue', $today->toDateString())) {
                continue;
            }

            $email = $booking->guest?->email ?? $booking->user?->email;
            if (! $email) {
                continue;
            }

            try {
                Mail::to($email)->queue(new OverdueReturnNotice($booking));
                $booking->markReminderSent('overdue', $today->toDateString());
                $sent++;
            } catch (\Throwable $e) {
                Log::warning("Overdue return email failed for booking #{$booking->id}: ".$e->getMessage());
            }
        }

        return $sent;
    }
}
