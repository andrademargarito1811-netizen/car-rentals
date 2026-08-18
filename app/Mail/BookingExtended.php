<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class BookingExtended extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Booking $booking,
        public float $additionalAmount,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Rental Extended - '.$this->booking->reference_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.booking-extended',
            with: [
                'booking' => $this->booking,
                'additionalAmount' => $this->additionalAmount,
            ],
        );
    }
}
