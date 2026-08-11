<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tblguests', function (Blueprint $table) {
            $table->string('company_name', 150)->nullable()->after('last_name');
        });
    }

    public function down(): void
    {
        Schema::table('tblguests', function (Blueprint $table) {
            $table->dropColumn('company_name');
        });
    }
};
