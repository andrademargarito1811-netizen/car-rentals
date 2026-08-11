<?php

namespace App\Mail;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UpcomingPickupReminder extends Mailable
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
            subject: 'Your Pickup is Tomorrow - '.$this->booking->reference_code,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.upcoming-pickup-reminder',
            with: [
                'booking' => $this->booking,
            ],
        );
    }
}
