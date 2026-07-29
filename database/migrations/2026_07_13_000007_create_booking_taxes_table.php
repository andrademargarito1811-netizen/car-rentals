<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tax_id')->nullable()->constrained()->nullOnDelete();
            $table->string('tax_desc');
            $table->decimal('amount', 10, 2);
            $table->boolean('add_or_minus');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_taxes');
    }
};
