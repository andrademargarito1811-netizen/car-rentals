<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tblcars', function (Blueprint $table) {
            $table->unsignedInteger('free_km_per_day')->nullable();
            $table->decimal('additional_km_rate', 10, 2)->nullable();
            $table->decimal('fuel_tank_capacity', 8, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tblcars', function (Blueprint $table) {
            $table->dropColumn(['free_km_per_day', 'additional_km_rate', 'fuel_tank_capacity']);
        });
    }
};
