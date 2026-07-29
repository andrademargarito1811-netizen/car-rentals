<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_hero_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_setting_id')->constrained('reservation_settings')->cascadeOnDelete();
            $table->string('image_path', 255);
            $table->string('alt_text', 255)->nullable();
            $table->string('caption', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_hero_images');
    }
};
