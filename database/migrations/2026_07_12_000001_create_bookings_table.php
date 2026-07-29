<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bookings')) {
            Schema::create('bookings', function (Blueprint $table) {
                $table->id();
                $table->string('reference_code', 20)->nullable()->unique();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->unsignedBigInteger('guest_id')->nullable();
                $table->unsignedBigInteger('car_id');
                $table->date('start_date');
                $table->date('end_date');
                $table->time('pickup_time')->nullable();
                $table->time('return_time')->nullable();
                $table->unsignedBigInteger('pickup_location_id')->nullable();
                $table->unsignedBigInteger('return_location_id')->nullable();
                $table->decimal('total_amount', 10, 2);
                $table->string('status', 50);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
                $table->foreign('guest_id')->references('guest_id')->on('tblguests')->noActionOnDelete();
                $table->foreign('car_id')->references('id')->on('tblcars');
                $table->foreign('pickup_location_id')->references('location_id')->on('tblvehicle_location')->noActionOnDelete();
                $table->foreign('return_location_id')->references('location_id')->on('tblvehicle_location')->noActionOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
