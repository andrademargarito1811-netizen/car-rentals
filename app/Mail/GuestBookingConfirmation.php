<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GuestBookingConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function envelope(): Envelope
    {
        $subject = $this->booking->status === 'confirmed'
            ? 'Reservation Confirmed - ' . $this->booking->reference_code
            : 'Reservation Received - ' . $this->booking->reference_code;

        return new Envelope(
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.guest-booking-confirmation',
            with: [
                'booking' => $this->booking,
            ],
        );
    }
}
