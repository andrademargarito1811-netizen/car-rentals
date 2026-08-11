<?php

namespace Tests\Feature;

use App\Models\LegalDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_terms_page_renders_document_content(): void
    {
        $document = LegalDocument::where('slug', 'terms-and-conditions')->first();

        $response = $this->get(route('terms-and-conditions'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Legal/TermsAndConditions')
            ->where('document.id', $document->id));
    }

    public function test_admin_can_view_agreements_index(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->get(route('admin.agreements.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Agreements/Index')
            ->has('websiteDocuments', 4)
            ->has('invoiceDocuments', 2));
    }

    public function test_admin_can_update_legal_document(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $document = LegalDocument::where('slug', 'privacy-policy')->first();

        $response = $this->actingAs($admin)->put(route('admin.agreements.update', $document), [
            'title' => 'Updated Privacy Policy',
            'subtitle' => 'Updated subtitle',
            'content' => '<p>Updated content</p>',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('admin.agreements.index'));

        $this->assertDatabaseHas('legal_documents', [
            'id' => $document->id,
            'title' => 'Updated Privacy Policy',
            'subtitle' => 'Updated subtitle',
            'version' => $document->version + 1,
            'updated_by' => $admin->id,
        ]);
    }
}
