<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('extra_charges', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('type', 20)->default('Extra Charge'); // 'Extra Charge' | 'Discount'
            $table->string('calculation', 20)->default('Fixed'); // 'Fixed' | 'Per Day'
            $table->string('value_in', 20)->default('Amount'); // 'Amount' | 'Percentage'
            $table->string('operator', 1)->default('+'); // '+' | '-'
            $table->decimal('rate', 10, 2)->default(0);
            $table->boolean('taxable')->default(false);
            $table->boolean('apply_always')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('extra_charges');
    }
};
