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
            $table->integer('availability_id')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn('availability_id');
        });
    }
};
