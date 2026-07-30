<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('about_us_page_settings', function (Blueprint $table) {
            $table->id();
            $table->string('hero_badge')->default('About Us');
            $table->string('hero_title')->default('Our Story');
            $table->string('hero_highlight')->default('Driven by Excellence');
            $table->text('hero_description')->nullable();
            $table->string('hero_image_path')->nullable();
            $table->string('story_heading')->default('Our Journey');
            $table->text('story_content')->nullable();
            $table->text('mission_text')->nullable();
            $table->text('vision_text')->nullable();
            $table->json('stats')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('about_us_page_settings');
    }
};
