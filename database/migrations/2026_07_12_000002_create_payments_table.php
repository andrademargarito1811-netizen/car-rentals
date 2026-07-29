<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('booking_id')->constrained('bookings');
                $table->string('type', 50)->nullable();
                $table->decimal('amount', 10, 2);
                $table->string('payment_method', 50);
                $table->string('payment_status', 50);
                $table->string('transaction_id', 255)->nullable();
                $table->string('card_last_four', 4)->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
