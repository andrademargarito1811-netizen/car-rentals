<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_handovers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('booking_id');
            $table->string('type', 20);
            $table->unsignedTinyInteger('fuel_level')->nullable();
            $table->decimal('odometer', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('captured_by')->nullable();
            $table->timestamp('captured_at')->nullable();
            $table->timestamps();

            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
            $table->foreign('captured_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['booking_id', 'type'], 'uq_handovers_booking_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_handovers');
    }
};
