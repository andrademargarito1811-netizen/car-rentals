<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement('
                DECLARE @sql NVARCHAR(MAX) = N\' \';
                SELECT @sql += \'ALTER TABLE [\' + OBJECT_SCHEMA_NAME(fk.parent_object_id) + \'].[\' + OBJECT_NAME(fk.parent_object_id) + \'] DROP CONSTRAINT [\' + fk.name + \']; \'
                FROM sys.foreign_keys fk
                INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                INNER JOIN sys.tables t ON fkc.referenced_object_id = t.object_id
                WHERE t.name = \'cars\';
                EXEC sp_executesql @sql;
            ');
        }

        Schema::dropIfExists('cars');

        Schema::create('tblcars', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->string('stock_number', 50)->nullable()->unique();
            $table->string('license_plate', 20)->nullable()->unique();
            $table->string('vin', 17)->nullable()->unique();
            $table->string('brand', 100);
            $table->string('model', 100);
            $table->year('year');
            $table->unsignedTinyInteger('vehicle_doors')->nullable();
            $table->string('color', 50)->nullable();

            $table->unsignedTinyInteger('seats')->nullable();
            $table->unsignedTinyInteger('baggage_capacity')->nullable();
            $table->decimal('maximum_weight', 8, 2)->nullable();
            $table->string('class_id', 20)->nullable();

            $table->decimal('daily_rate', 10, 2)->default(0.00);
            $table->date('sale_date')->nullable();
            $table->decimal('sale_price', 10, 2)->nullable();
            $table->string('sold_to', 100)->nullable();

            $table->string('engine', 100)->nullable();
            $table->string('transmission', 20)->default('automatic');
            $table->string('fuel_type', 20)->default('gasoline');
            $table->decimal('fuel_charges', 10, 2)->nullable();
            $table->decimal('fuel_consumption', 5, 2)->nullable();
            $table->unsignedSmallInteger('co2_emission')->nullable();

            $table->text('description')->nullable();
            $table->string('image_path')->nullable();

            $table->unsignedBigInteger('availability_id')->nullable();
            $table->boolean('air_conditioned')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('location_id')->references('location_id')->on('tblvehicle_location')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('class_id')->references('class_no')->on('tblvehicle_classes')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('availability_id')->references('available_id')->on('tblvehicle_availability')->onDelete('set null')->onUpdate('cascade');

            $table->index(['brand', 'model'], 'idx_cars_brand_model');
            $table->index('year', 'idx_cars_year');
            $table->index('daily_rate', 'idx_cars_daily_rate');
            $table->index('fuel_type', 'idx_cars_fuel_type');
            $table->index('availability_id', 'idx_cars_availability');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tblcars');
    }
};
