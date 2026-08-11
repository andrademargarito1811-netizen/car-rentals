<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This Laravel-skeleton table duplicates the repo's real payments schema
        // (created by 2026_07_12_000002_create_payments_table.php). Skipping prevents
        // a conflicting `payments` table without the repo's required `type` column.
        return;
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
