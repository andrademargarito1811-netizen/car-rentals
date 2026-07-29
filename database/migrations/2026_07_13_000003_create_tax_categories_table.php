<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('tax_categories')->insert([
            ['name' => 'Surcharge'],
            ['name' => 'Tax'],
            ['name' => 'Discount'],
            ['name' => 'Others'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_categories');
    }
};
