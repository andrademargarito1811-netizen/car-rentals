<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Booking;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AutoCancelExpiredBookings extends Command
{
    protected $signature = 'bookings:auto-cancel';

    protected $description = 'Cancel pending bookings whose pickup date passed without confirmation';

    public function handle(): int
    {
        $days = (int) config('reservation.pending_auto_cancel_after_days', 1);
        $cutoff = now()->subDays($days)->startOfDay();

        $bookings = Booking::where('status', 'pending')
            ->whereDate('start_date', '<', $cutoff)
            ->get();

        $cancelled = 0;

        foreach ($bookings as $booking) {
            try {
                DB::transaction(function () use ($booking) {
                    $booking->update([
                        'status' => 'cancelled',
                        'notes' => trim(($booking->notes ? $booking->notes."\n" : '').'Auto-cancelled: pickup date passed without confirmation.'),
                    ]);

                    AuditLog::create([
                        'user_id' => null,
                        'action' => 'booking_auto_cancelled',
                        'model_type' => Booking::class,
                        'model_id' => $booking->id,
                        'description' => "Booking {$booking->reference_code} auto-cancelled — pickup date ({$booking->start_date->format('Y-m-d')}) passed while still pending",
                        'old_values' => ['status' => 'pending'],
                        'new_values' => ['status' => 'cancelled'],
                        'ip_address' => null,
                        'user_agent' => null,
                    ]);
                });

                $cancelled++;
            } catch (\Throwable $e) {
                Log::warning("Auto-cancel failed for booking #{$booking->id}: ".$e->getMessage());
            }
        }

        $this->info("Auto-cancelled {$cancelled} expired pending booking(s).");

        return self::SUCCESS;
    }
}
