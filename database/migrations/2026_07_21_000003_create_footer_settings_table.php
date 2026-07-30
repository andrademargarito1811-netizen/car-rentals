<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('footer_settings', function (Blueprint $table) {
            $table->id();
            $table->string('brand_name', 255)->default('West Car Rentals');
            $table->text('brand_description')->nullable()->default('Premium car rental services with locations across the country. Your journey starts here.');
            $table->string('logo_path', 255)->nullable()->default('/img/company_logo/company-logos-01.png');
            $table->string('newsletter_heading', 255)->default('Stay in the loop');
            $table->text('newsletter_description')->nullable()->default('Get the latest deals and updates delivered to your inbox.');
            $table->string('newsletter_placeholder', 255)->default('Enter your email');
            $table->boolean('newsletter_active')->default(true);
            $table->string('contact_email', 255)->default('info@westcarsales.com');
            $table->string('contact_phone', 255)->default('+1 (800) 555-WEST');
            $table->string('contact_hours', 255)->default('Mon-Sat: 8AM - 8PM');
            $table->string('copyright_text', 255)->default('West Car Sales. All rights reserved.');
            $table->json('quick_links')->nullable();
            $table->json('legal_links')->nullable();
            $table->json('social_links')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('footer_settings')->insert([
            'brand_name' => 'West Car Rentals',
            'brand_description' => 'Premium car rental services with locations across the country. Your journey starts here.',
            'logo_path' => '/img/company_logo/company-logos-01.png',
            'newsletter_heading' => 'Stay in the loop',
            'newsletter_description' => 'Get the latest deals and updates delivered to your inbox.',
            'newsletter_placeholder' => 'Enter your email',
            'newsletter_active' => true,
            'contact_email' => 'info@westcarsales.com',
            'contact_phone' => '+1 (800) 555-WEST',
            'contact_hours' => 'Mon-Sat: 8AM - 8PM',
            'copyright_text' => 'West Car Sales. All rights reserved.',
            'quick_links' => json_encode([
                ['label' => 'Home', 'url' => '/'],
                ['label' => 'Fleet', 'url' => '/fleet'],
                ['label' => 'Reservation', 'url' => '/reservations'],
                ['label' => 'Track Reservation', 'url' => '/track-reservation'],
                ['label' => 'Locations', 'url' => '/locations'],
                ['label' => 'Contact', 'url' => '/contact'],
            ]),
            'legal_links' => json_encode([
                ['label' => 'Privacy Policy', 'url' => '/privacy-policy'],
                ['label' => 'Terms of Service', 'url' => '/terms-of-service'],
                ['label' => 'Cookie Policy', 'url' => '/cookie-policy'],
                ['label' => 'Terms and Conditions', 'url' => '/terms-and-conditions'],
            ]),
            'social_links' => json_encode([
                ['platform' => 'facebook', 'label' => 'Facebook', 'url' => '#'],
                ['platform' => 'twitter', 'label' => 'Twitter', 'url' => '#'],
                ['platform' => 'instagram', 'label' => 'Instagram', 'url' => '#'],
            ]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('footer_settings');
    }
};
