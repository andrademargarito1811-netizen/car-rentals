<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tblvehicle_classes', function (Blueprint $table) {
            $table->integer('grace_minutes')->default(30)->after('class_desc');
        });
    }

    public function down(): void
    {
        Schema::table('tblvehicle_classes', function (Blueprint $table) {
            $table->dropColumn('grace_minutes');
        });
    }
};
