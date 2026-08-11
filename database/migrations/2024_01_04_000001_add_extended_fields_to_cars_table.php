<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cars')) {
            return; // skeleton `cars` table is not created by this repo
        }

        Schema::table('cars', function (Blueprint $table) {
            $table->string('vehicle_location')->nullable()->after('image_path');
            $table->string('stock_number')->nullable()->unique()->after('vehicle_location');
            $table->string('vin')->nullable()->unique()->after('stock_number');
            $table->string('color')->nullable()->after('vin');
            $table->integer('baggage_capacity')->nullable()->after('seats');
            $table->integer('vehicle_doors')->nullable()->after('baggage_capacity');
            $table->date('sale_date')->nullable()->after('vehicle_doors');
            $table->decimal('sale_price', 10, 2)->nullable()->after('sale_date');
            $table->string('sold_to')->nullable()->after('sale_price');
            $table->boolean('air_conditioned')->default(true)->after('sold_to');
            $table->decimal('maximum_weight', 8, 2)->nullable()->after('air_conditioned');
            $table->string('engine')->nullable()->after('maximum_weight');
            $table->string('power_type')->nullable()->after('engine');
            $table->decimal('fuel_charges', 10, 2)->nullable()->after('power_type');
            $table->decimal('fuel_consumption', 8, 2)->nullable()->after('fuel_charges');
            $table->integer('co2_emission')->nullable()->after('fuel_consumption');
            $table->string('vehicle_rate_type')->nullable()->after('co2_emission');
        });
    }

    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $table->dropColumn([
                'vehicle_location', 'stock_number', 'vin', 'color',
                'baggage_capacity', 'vehicle_doors', 'sale_date',
                'sale_price', 'sold_to', 'air_conditioned', 'maximum_weight',
                'engine', 'power_type', 'fuel_charges', 'fuel_consumption',
                'co2_emission', 'vehicle_rate_type',
            ]);
        });
    }
};
