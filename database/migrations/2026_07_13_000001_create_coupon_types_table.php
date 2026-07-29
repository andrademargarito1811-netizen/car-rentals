<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        DB::table('coupon_types')->insert([
            ['name' => 'Amount'],
            ['name' => 'Percentage'],
            ['name' => 'Per Day'],
            ['name' => 'Day Free'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_types');
    }
};
