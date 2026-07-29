<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hero_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('hero_settings', 'badge_enabled')) {
                $table->boolean('badge_enabled')->default(true)->after('badge_text');
            }
            if (!Schema::hasColumn('hero_settings', 'badge_icon')) {
                $table->string('badge_icon', 50)->default('tag')->after('badge_enabled');
            }
            if (!Schema::hasColumn('hero_settings', 'booking_badge_text')) {
                $table->string('booking_badge_text', 255)->default('Exclusive in Palau')->after('badge_icon');
            }
            if (!Schema::hasColumn('hero_settings', 'booking_badge_enabled')) {
                $table->boolean('booking_badge_enabled')->default(true)->after('booking_badge_text');
            }
            if (!Schema::hasColumn('hero_settings', 'booking_badge_icon')) {
                $table->string('booking_badge_icon', 50)->default('tag')->after('booking_badge_enabled');
            }
            // Drop link columns if they still exist from intermediate migrations
            if (Schema::hasColumn('hero_settings', 'badge_link')) {
                $table->dropColumn('badge_link');
            }
            if (Schema::hasColumn('hero_settings', 'booking_badge_link')) {
                $table->dropColumn('booking_badge_link');
            }
        });
    }

    public function down(): void
    {
        Schema::table('hero_settings', function (Blueprint $table) {
            $table->dropColumn([
                'badge_enabled', 'badge_icon',
                'booking_badge_text', 'booking_badge_enabled', 'booking_badge_icon',
            ]);
        });
    }
};
