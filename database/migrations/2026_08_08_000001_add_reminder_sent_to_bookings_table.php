<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('bookings') || Schema::hasColumn('bookings', 'reminder_sent')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            $table->json('reminder_sent')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('bookings') || ! Schema::hasColumn('bookings', 'reminder_sent')) {
            return;
        }

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn('reminder_sent');
        });
    }
};
