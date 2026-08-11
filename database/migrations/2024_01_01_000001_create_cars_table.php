<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This Laravel-skeleton table duplicates the repo's real fleet schema.
        // The real table (tblcars) is created by 2024_01_12_000001_create_tblcars_table.php.
        // Skipping prevents a conflicting/duplicate `cars` table.
        return;
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
