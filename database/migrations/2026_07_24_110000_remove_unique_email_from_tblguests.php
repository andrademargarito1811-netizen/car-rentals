<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tblguests', function (Blueprint $table) {
            $table->dropUnique('idx_guests_email');
        });
    }

    public function down(): void
    {
        Schema::table('tblguests', function (Blueprint $table) {
            $table->unique('email', 'idx_guests_email');
        });
    }
};
