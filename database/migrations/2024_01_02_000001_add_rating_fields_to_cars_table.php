<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cars')) {
            return; // skeleton `cars` table is not created by this repo
        }

        Schema::table('cars', function (Blueprint $table) {
            $table->decimal('avg_rating', 3, 2)->default(0)->after('status');
            $table->unsignedInteger('ratings_count')->default(0)->after('avg_rating');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn(['avg_rating', 'ratings_count']);
        });
    }
};
