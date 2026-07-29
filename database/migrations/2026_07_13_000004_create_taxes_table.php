<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->string('tax_desc', 255);
            $table->string('calculation', 20); // 'Per Day' or 'Per Rental'
            $table->foreignId('category_id')->constrained('tax_categories')->cascadeOnDelete();
            $table->string('value_in', 20); // 'Amount' or 'Percentage'
            $table->boolean('add_or_minus')->default(true); // true = add, false = minus
            $table->decimal('rate', 10, 2);
            $table->boolean('apply_always')->default(false);
            $table->foreignId('location_id')->nullable()->constrained('tblvehicle_location', 'location_id')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
