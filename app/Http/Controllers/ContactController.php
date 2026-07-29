<?php

namespace App\Http\Controllers;

use App\Events\ContactMessageSent;
use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'subject' => 'required|string|max:255',
            'reservation_number' => 'nullable|string|max:100',
            'message' => 'required|string',
        ]);

        $message = ContactMessage::create($validated);

        try {
            event(new ContactMessageSent($message));
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast ContactMessageSent: ' . $e->getMessage());
        }

        return redirect()->route('contact')->with('success', 'Your message has been sent. We\'ll get back to you shortly.');
    }
}
