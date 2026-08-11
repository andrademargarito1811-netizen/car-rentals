<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations_page_settings', function (Blueprint $table) {
            $table->boolean('hero_badge_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('locations_page_settings', function (Blueprint $table) {
            $table->dropColumn('hero_badge_active');
        });
    }
};
