<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('reservation_settings', 'booking_terms')) {
            Schema::table('reservation_settings', function (Blueprint $table) {
                $table->dropColumn('booking_terms');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('reservation_settings', 'booking_terms')) {
            Schema::table('reservation_settings', function (Blueprint $table) {
                $table->text('booking_terms')->nullable()->default(null);
            });
        }
    }
};
