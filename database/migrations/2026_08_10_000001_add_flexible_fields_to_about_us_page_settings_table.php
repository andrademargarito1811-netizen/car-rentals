<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('about_us_page_settings', function (Blueprint $table) {
            $table->string('story_image_path')->nullable()->after('story_content');
            $table->json('values')->nullable()->after('vision_text');
            $table->json('team_members')->nullable()->after('values');
        });
    }

    public function down(): void
    {
        Schema::table('about_us_page_settings', function (Blueprint $table) {
            $table->dropColumn(['story_image_path', 'values', 'team_members']);
        });
    }
};
