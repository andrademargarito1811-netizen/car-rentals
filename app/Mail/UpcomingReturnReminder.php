<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UpcomingReturnReminder extends Mailable
{
    use Queueable, SerializesModels;

    public Booking $booking;

    public function __construct(Booking $booking)
    {
        $this->booking = $booking;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Returning Your Car Tomorrow - '.$this->booking->reference_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.upcoming-return-reminder',
            with: [
                'booking' => $this->booking,
            ],
        );
    }
}
