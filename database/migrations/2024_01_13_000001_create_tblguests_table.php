<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tblguests', function (Blueprint $table) {
            $table->id('guest_id');
            $table->string('title', 10)->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->unsignedTinyInteger('driver_age')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 255);
            $table->string('address', 255)->nullable();
            $table->string('address2', 255)->nullable();
            $table->string('country', 100)->nullable();
            $table->string('state', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('postal_code', 20)->nullable();
            $table->string('flight_no', 50)->nullable();
            $table->timestamps();

            $table->unique('email', 'idx_guests_email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tblguests');
    }
};
