<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations_page_settings', function (Blueprint $table) {
            $table->id();
            $table->string('hero_badge', 255)->default('Palau, Micronesia');
            $table->string('hero_title', 255)->default('Our');
            $table->string('hero_highlight', 255)->default('Locations');
            $table->text('hero_description')->nullable()->default('Two convenient locations across Palau — whether you\'re in the heart of Koror or arriving at the airport, we\'ve got you covered.');
            $table->string('hero_image_path', 255)->nullable();
            $table->string('hero_button_text', 255)->default('View Locations');
            $table->string('hero_phone_label', 255)->default('Call Us');
            $table->string('hero_phone_number', 255)->default('+6804881587');
            $table->boolean('hero_active')->default(true);
            $table->string('cta_title', 255)->default('Ready to Hit the Road?');
            $table->text('cta_description')->nullable()->default('Book your vehicle today and explore the beautiful islands of Palau at your own pace.');
            $table->string('cta_button_text', 255)->default('Browse Vehicles');
            $table->string('cta_button_url', 255)->default('/vehicles');
            $table->string('cta_phone_label', 255)->default('Call Us');
            $table->string('cta_phone_number', 255)->default('+6804881587');
            $table->boolean('cta_active')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('locations_page_settings')->insert([
            'hero_badge' => 'Palau, Micronesia',
            'hero_title' => 'Our',
            'hero_highlight' => 'Locations',
            'hero_description' => 'Two convenient locations across Palau — whether you\'re in the heart of Koror or arriving at the airport, we\'ve got you covered.',
            'hero_button_text' => 'View Locations',
            'hero_phone_label' => 'Call Us',
            'hero_phone_number' => '+6804881587',
            'hero_active' => true,
            'cta_title' => 'Ready to Hit the Road?',
            'cta_description' => 'Book your vehicle today and explore the beautiful islands of Palau at your own pace.',
            'cta_button_text' => 'Browse Vehicles',
            'cta_button_url' => '/vehicles',
            'cta_phone_label' => 'Call Us',
            'cta_phone_number' => '+6804881587',
            'cta_active' => true,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('locations_page_settings');
    }
};
