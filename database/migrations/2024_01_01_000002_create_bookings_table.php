<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This Laravel-skeleton table duplicates the repo's real bookings schema
        // (created by 2026_07_12_000001_create_bookings_table.php) and references the
        // skeleton `cars` table, which the repo's tblcars migration drops. Skipping
        // prevents a conflicting `bookings` table.
        return;
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
