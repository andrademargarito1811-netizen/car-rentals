<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tblvehicle_location', function (Blueprint $table) {
            $table->id('location_id');
            $table->string('location', 100);
            $table->string('address', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index('is_active', 'idx_locations_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tblvehicle_location');
    }
};
