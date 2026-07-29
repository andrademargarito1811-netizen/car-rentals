<?php

namespace App\Events;

use App\Models\Booking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BookingUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking->loadMissing(['guest', 'car']);
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.bookings'),
            new Channel('car.' . $this->booking->car_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->booking->id,
            'reference_code' => $this->booking->reference_code,
            'customer_name' => $this->booking->guest
                ? $this->booking->guest->first_name . ' ' . $this->booking->guest->last_name
                : ($this->booking->user?->name ?? 'Guest'),
            'car' => $this->booking->car
                ? $this->booking->car->brand . ' ' . $this->booking->car->model
                : 'Unknown',
            'total_amount' => $this->booking->total_amount,
            'status' => $this->booking->status,
            'start_date' => $this->booking->start_date->format('Y-m-d'),
            'end_date' => $this->booking->end_date->format('Y-m-d'),
            'updated_at' => $this->booking->updated_at->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'booking.updated';
    }
}
