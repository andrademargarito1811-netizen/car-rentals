<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hero_settings', function (Blueprint $table) {
            $table->string('why_choose_us_heading', 255)->default('Built for a Better Rental Experience');
            $table->string('why_choose_us_subheading', 500)->default('We go the extra mile to make every rental smooth, transparent, and enjoyable from start to finish.');
        });
    }

    public function down(): void
    {
        Schema::table('hero_settings', function (Blueprint $table) {
            $table->dropColumn(['why_choose_us_heading', 'why_choose_us_subheading']);
        });
    }
};
