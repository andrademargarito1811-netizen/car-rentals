<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('legal_documents')
            ->where('slug', 'terms-and-conditions')
            ->update([
                'title' => 'Terms and Conditions',
                'subtitle' => 'The terms and conditions governing the use of our website and services.',
            ]);
    }

    public function down(): void
    {
        // Intentionally empty; this restores the originally seeded values.
    }
};
