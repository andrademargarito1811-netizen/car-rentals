<?php

namespace Tests\Unit;

use App\Models\Conversation;
use App\Models\Faq;
use App\Services\ChatAutoReplyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatAutoReplyServiceTest extends TestCase
{
    use RefreshDatabase;

    private ChatAutoReplyService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(ChatAutoReplyService::class);
    }

    public function test_extract_contact_info_finds_email(): void
    {
        [$email, $phone] = $this->service->extractContactInfo('Contact me at john@example.com thanks');
        $this->assertEquals('john@example.com', $email);
    }

    public function test_extract_contact_info_finds_phone(): void
    {
        [$email, $phone] = $this->service->extractContactInfo('Call me at 09123456789');
        $this->assertEquals('09123456789', $phone);
    }

    public function test_extract_contact_info_finds_both(): void
    {
        [$email, $phone] = $this->service->extractContactInfo('Email me@test.com or call 09123456789');
        $this->assertEquals('me@test.com', $email);
        $this->assertEquals('09123456789', $phone);
    }

    public function test_extract_contact_info_returns_null_when_none(): void
    {
        [$email, $phone] = $this->service->extractContactInfo('Just a regular message');
        $this->assertNull($email);
        $this->assertNull($phone);
    }

    public function test_find_matching_faq_returns_null_when_no_faqs(): void
    {
        $result = $this->service->findMatchingFaq('How do I rent a car?');
        $this->assertNull($result);
    }

    public function test_find_matching_faq_finds_exact_match(): void
    {
        $faq = Faq::create([
            'question' => 'How do I rent a car?',
            'answer' => 'You can rent a car by visiting our website.',
            'is_active' => true,
        ]);

        $result = $this->service->findMatchingFaq('How do I rent a car?');
        $this->assertNotNull($result);
        $this->assertEquals($faq->id, $result->id);
    }

    public function test_find_matching_faq_returns_null_for_low_score(): void
    {
        Faq::create([
            'question' => 'What are your rental requirements?',
            'answer' => 'You need a valid license.',
            'is_active' => true,
        ]);

        $result = $this->service->findMatchingFaq('I like pizza');
        $this->assertNull($result);
    }

    public function test_handle_contact_info_updates_conversation(): void
    {
        $conversation = Conversation::create([
            'guest_token' => 'token-123',
            'status' => 'active',
        ]);

        $reply = $this->service->handleContactInfo($conversation, 'my email is test@example.com');

        $this->assertNotNull($reply);
        $this->assertEquals('test@example.com', $conversation->fresh()->contact_email);
    }

    public function test_handle_contact_info_returns_null_when_no_contact(): void
    {
        $conversation = Conversation::create([
            'guest_token' => 'token-456',
            'status' => 'active',
        ]);

        $reply = $this->service->handleContactInfo($conversation, 'Just a hello');

        $this->assertNull($reply);
    }

    public function test_create_auto_reply_uses_faq_when_matched(): void
    {
        Faq::create([
            'question' => 'What are your hours?',
            'answer' => 'We are open 9-5.',
            'is_active' => true,
        ]);

        $conversation = Conversation::create([
            'guest_token' => 'token-789',
            'status' => 'active',
        ]);

        $reply = $this->service->createAutoReply($conversation, 'What are your hours?');

        $this->assertNotNull($reply);
        $this->assertEquals('We are open 9-5.', $reply->body);
    }

    public function test_create_auto_reply_uses_generic_on_first_message(): void
    {
        $conversation = Conversation::create([
            'guest_token' => 'token-101',
            'status' => 'active',
        ]);

        $reply = $this->service->createAutoReply($conversation, 'I need help');

        $this->assertNotNull($reply);
        $this->assertStringContainsString('Thank you for reaching out', $reply->body);
        $this->assertNotNull($conversation->fresh()->auto_replied_at);
    }

    public function test_create_auto_reply_returns_null_on_second_unmatched_message(): void
    {
        $conversation = Conversation::create([
            'guest_token' => 'token-202',
            'status' => 'active',
            'auto_replied_at' => now(),
        ]);

        $reply = $this->service->createAutoReply($conversation, 'Still need help');
        $this->assertNull($reply);
    }
}
