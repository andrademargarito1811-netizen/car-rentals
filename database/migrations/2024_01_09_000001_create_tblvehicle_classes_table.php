<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tblvehicle_classes', function (Blueprint $table) {
            $table->string('class_no', 20)->primary();
            $table->string('class_desc', 100);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tblvehicle_classes');
    }
};
