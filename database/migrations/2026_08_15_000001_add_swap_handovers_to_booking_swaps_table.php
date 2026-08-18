<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking_swaps', function (Blueprint $table) {
            $table->foreignId('swap_out_handover_id')
                ->nullable()
                ->after('to_car_id')
                ->constrained('vehicle_handovers')
                ->nullOnDelete();
            $table->foreignId('swap_in_handover_id')
                ->nullable()
                ->after('swap_out_handover_id')
                ->constrained('vehicle_handovers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('booking_swaps', function (Blueprint $table) {
            $table->dropConstrainedForeignId('swap_out_handover_id');
            $table->dropConstrainedForeignId('swap_in_handover_id');
        });
    }
};
