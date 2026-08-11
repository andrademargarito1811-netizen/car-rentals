<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_extra_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('extra_charge_id')->nullable()->constrained()->nullOnDelete();
            // SQL Server disallows multiple cascade paths to a table, so the
            // handover link uses NO ACTION to avoid cascading through both
            // booking_id and vehicle_handovers.booking_id.
            $table->foreignId('handover_id')->nullable()->constrained('vehicle_handovers')->noActionOnDelete();
            $table->string('name', 255);
            $table->decimal('rate', 10, 2);
            $table->string('value_in', 20); // 'Amount' | 'Percentage'
            $table->string('calculation', 20); // 'Fixed' | 'Per Day'
            $table->string('operator', 1); // '+' | '-'
            $table->boolean('taxable')->default(false);
            $table->decimal('amount', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->string('source', 20)->default('return');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_extra_charges');
    }
};
