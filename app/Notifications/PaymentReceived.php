<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class PaymentReceived extends Notification implements ShouldBroadcast
{
    use Queueable;

    public const TYPE = 'payment.received';

    public function __construct(
        public Booking $booking,
        public Payment $payment,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        $this->booking->loadMissing(['guest', 'user', 'car']);

        $name = $this->booking->guest
            ? trim($this->booking->guest->first_name.' '.$this->booking->guest->last_name)
            : ($this->booking->user?->name ?? 'A guest');

        $amount = (float) $this->payment->amount;
        $isRefund = $this->payment->type === 'refund';

        return [
            'type' => self::TYPE,
            'title' => $isRefund ? 'Refund recorded' : 'Payment received',
            'message' => $isRefund
                ? "\$".number_format(abs($amount), 2)." refunded to {$name} for booking {$this->booking->reference_code}"
                : "{$name} paid \$".number_format($amount, 2)." ({$this->payment->type}) for booking {$this->booking->reference_code}",
            'icon' => 'banknote',
            'action_url' => route('admin.bookings.show', $this->booking->id),
            'reference_code' => $this->booking->reference_code,
            'amount' => $amount,
            'payment_type' => $this->payment->type,
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastAs(): string
    {
        return 'notification.received';
    }

    public function broadcastType(): string
    {
        return self::TYPE;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.bookings'),
        ];
    }
}
