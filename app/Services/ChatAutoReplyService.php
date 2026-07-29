<?php

namespace App\Services;

use App\Events\NewMessage;
use App\Models\Conversation;
use App\Models\Faq;
use App\Models\Message;

class ChatAutoReplyService
{
    public function findMatchingFaq(string $body): ?Faq
    {
        $faqs = Faq::where('is_active', true)->get();

        $bodyLower = mb_strtolower(trim($body));
        $bodyWords = array_filter(str_word_count($bodyLower, 1), fn($w) => mb_strlen($w) > 2);

        if (empty($bodyWords)) {
            return null;
        }

        $bestMatch = null;
        $bestScore = 0;

        foreach ($faqs as $faq) {
            $qLower = mb_strtolower(trim($faq->question));

            $containsQuestion = str_contains($bodyLower, $qLower);
            $questionContainsMsg = str_contains($qLower, $bodyLower);

            if ($containsQuestion || $questionContainsMsg) {
                return $faq;
            }

            $qWords = array_filter(str_word_count($qLower, 1), fn($w) => mb_strlen($w) > 2);
            $common = count(array_intersect($bodyWords, $qWords));
            $max = max(count($bodyWords), count($qWords));
            $score = $max > 0 ? $common / $max : 0;

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestMatch = $faq;
            }
        }

        return $bestScore >= 0.4 ? $bestMatch : null;
    }

    public function extractContactInfo(string $body): array
    {
        $email = null;
        $phone = null;

        if (preg_match('/[\w\.\-]+@[\w\.\-]+\.\w+/', $body, $m)) {
            $email = $m[0];
        }

        if (preg_match('/\+?\d{7,15}/', $body, $m)) {
            $phone = $m[0];
        }

        if (preg_match('/(?:09|03|07|08|05|\+84)\d{8,9}/', $body, $m)) {
            $phone = $m[0];
        }

        return [$email, $phone];
    }

    public function handleContactInfo(Conversation $conversation, string $body): ?Message
    {
        [$email, $phone] = $this->extractContactInfo($body);
        $updated = false;

        if ($email && $email !== $conversation->contact_email) {
            $conversation->contact_email = $email;
            $updated = true;
        }

        if ($phone && $phone !== $conversation->contact_phone) {
            $conversation->contact_phone = $phone;
            $updated = true;
        }

        if ($updated) {
            $conversation->save();

            $parts = [];
            if ($conversation->contact_email) $parts[] = $conversation->contact_email;
            if ($conversation->contact_phone) $parts[] = $conversation->contact_phone;
            $details = implode(' and ', $parts);

            $reply = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => null,
                'sender_type' => 'system',
                'body' => "Thanks! We've noted your contact details ({$details}). Our team will be in touch with you shortly.",
            ]);

            $conversation->touch();

            try {
                broadcast(new NewMessage($reply));
            } catch (\Exception $e) {
                logger()->error('Contact info reply broadcast failed', ['error' => $e->getMessage()]);
            }

            $reply->load('sender:id,name');
            return $reply;
        }

        return null;
    }

    public function createAutoReply(Conversation $conversation, string $body): ?Message
    {
        $faq = $this->findMatchingFaq($body);

        if ($faq) {
            $reply = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => null,
                'sender_type' => 'system',
                'body' => $faq->answer,
            ]);
        } elseif (!$conversation->auto_replied_at) {
            $replyBody = "Thank you for reaching out to West Car Rental! Our team has received your message and will review it shortly.\n\n"
                . "To help us follow up with you, feel free to share your email address or phone number below, and one of our agents will get back to you as soon as possible.\n\n"
                . "In the meantime, feel free to ask any other questions you may have!";

            $reply = Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => null,
                'sender_type' => 'system',
                'body' => $replyBody,
            ]);

            $conversation->update(['auto_replied_at' => now()]);
        } else {
            return null;
        }

        $conversation->touch();

        try {
            broadcast(new NewMessage($reply));
        } catch (\Exception $e) {
            logger()->error('Auto-reply broadcast failed', ['error' => $e->getMessage()]);
        }

        return $reply;
    }

    public function pruneStaleGuestConversations(): void
    {
        $cutoff = now()->subHours(24);
        Conversation::whereNotNull('guest_token')
            ->whereNull('admin_id')
            ->where('updated_at', '<', $cutoff)
            ->chunkById(50, function ($conversations) {
                foreach ($conversations as $conv) {
                    $conv->messages()->delete();
                    $conv->delete();
                }
            });
    }
}
