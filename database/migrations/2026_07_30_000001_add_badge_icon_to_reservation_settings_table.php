<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('reservation_settings', 'badge_icon')) {
                $table->string('badge_icon', 50)->default('tag')->after('badge_text');
            }
        });
    }

    public function down(): void
    {
        Schema::table('reservation_settings', function (Blueprint $table) {
            $table->dropColumn('badge_icon');
        });
    }
};
