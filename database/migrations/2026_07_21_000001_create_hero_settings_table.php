<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_settings', function (Blueprint $table) {
            $table->id();
            $table->string('badge_text', 255)->default('Premium Car Rental Service');
            $table->string('headline', 255)->default('Find Your');
            $table->string('headline_highlight', 255)->default('Perfect Ride');
            $table->string('tagline', 255)->nullable()->default('Drive Your Dreams, One Mile at a Time');
            $table->text('description')->nullable();
            $table->string('image_path', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert default hero settings
        DB::table('hero_settings')->insert([
            'badge_text' => 'Premium Car Rental Service',
            'headline' => 'Find Your',
            'headline_highlight' => 'Perfect Ride',
            'tagline' => 'Drive Your Dreams, One Mile at a Time',
            'description' => 'Browse our fleet of premium vehicles and hit the road with confidence',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_settings');
    }
};
