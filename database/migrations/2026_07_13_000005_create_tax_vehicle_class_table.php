<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_vehicle_class', function (Blueprint $table) {
            $table->foreignId('tax_id')->constrained('taxes')->cascadeOnDelete();
            $table->string('class_no', 20);
            $table->foreign('class_no')->references('class_no')->on('tblvehicle_classes')->cascadeOnDelete();
            $table->primary(['tax_id', 'class_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_vehicle_class');
    }
};
