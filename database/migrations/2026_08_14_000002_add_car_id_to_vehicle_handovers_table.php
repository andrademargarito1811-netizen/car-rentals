<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('vehicle_handovers', 'car_id')) {
            Schema::table('vehicle_handovers', function (Blueprint $table) {
                $table->unsignedBigInteger('car_id')->nullable()->after('booking_id');
                $table->foreign('car_id')->references('id')->on('tblcars')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('vehicle_handovers', 'car_id')) {
            Schema::table('vehicle_handovers', function (Blueprint $table) {
                $table->dropForeign(['car_id']);
                $table->dropColumn('car_id');
            });
        }
    }
};
