<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('drivers', function (Blueprint $table) {
            $table->id('driver_id');
            $table->unsignedBigInteger('guest_id')->nullable();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('birth_date');
            $table->string('license_number', 100);
            $table->string('license_number_hash', 64)->nullable();
            $table->string('license_category', 20);
            $table->date('license_expiry');
            $table->timestamps();

            $table->foreign('guest_id')->references('guest_id')->on('tblguests')->nullOnDelete();
            $table->index('license_number_hash', 'idx_drivers_license_hash');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('drivers');
    }
};
