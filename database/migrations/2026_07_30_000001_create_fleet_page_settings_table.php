<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_page_settings', function (Blueprint $table) {
            $table->id();
            $table->string('hero_badge')->default('Browse Our Fleet');
            $table->string('hero_title')->default('Explore Our');
            $table->string('hero_highlight')->default('Premium Fleet');
            $table->text('hero_description')->nullable();
            $table->string('hero_image_path')->nullable();
            $table->string('section_heading')->default('Find Your Perfect Drive');
            $table->string('section_subheading')->default('Choose from our wide selection of premium vehicles');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_page_settings');
    }
};
