<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Column is already NVARCHAR in the create migration; no-op.
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement('ALTER TABLE audit_logs ALTER COLUMN model_id BIGINT NOT NULL');
        } else {
            DB::statement('ALTER TABLE audit_logs MODIFY model_id BIGINT NOT NULL');
        }
    }
};
