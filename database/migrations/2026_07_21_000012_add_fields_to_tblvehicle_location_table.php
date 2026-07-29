<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tblvehicle_location', function (Blueprint $table) {
            $table->string('subtitle', 255)->nullable()->after('address');
            $table->string('city', 255)->nullable()->after('subtitle');
            $table->string('phone', 100)->nullable()->after('city');
            $table->string('hours', 255)->nullable()->after('phone');
            $table->decimal('lat', 10, 7)->nullable()->after('hours');
            $table->decimal('lng', 10, 7)->nullable()->after('lat');
            $table->string('image', 500)->nullable()->after('lng');
            $table->text('description')->nullable()->after('image');
            $table->json('features')->nullable()->after('description');
            $table->integer('sort_order')->default(0)->after('features');
        });
    }

    public function down(): void
    {
        Schema::table('tblvehicle_location', function (Blueprint $table) {
            $table->dropColumn([
                'subtitle', 'city', 'phone', 'hours', 'lat', 'lng',
                'image', 'description', 'features', 'sort_order',
            ]);
        });
    }
};
