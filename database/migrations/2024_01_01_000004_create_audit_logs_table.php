<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // This Laravel-skeleton table duplicates the repo's real audit_logs schema
        // (created by 2026_07_10_000002_create_audit_logs_table.php), which uses a
        // string `model_id`. Skipping prevents a conflicting `audit_logs` table.
        return;
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
