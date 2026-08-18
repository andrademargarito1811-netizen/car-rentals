<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_swaps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('from_car_id')->constrained('tblcars');
            $table->foreignId('to_car_id')->constrained('tblcars');
            $table->date('swap_date');
            $table->time('swap_time')->nullable();
            $table->unsignedInteger('from_days');
            $table->unsignedInteger('to_days');
            $table->decimal('from_subtotal', 10, 2);
            $table->decimal('to_subtotal', 10, 2);
            $table->decimal('old_total_amount', 10, 2);
            $table->decimal('new_total_amount', 10, 2);
            $table->decimal('price_delta', 10, 2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('booking_id');
            $table->index('swap_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_swaps');
    }
};
