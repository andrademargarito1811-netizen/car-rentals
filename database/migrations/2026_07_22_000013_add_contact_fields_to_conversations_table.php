<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('contact_email')->nullable()->after('status');
            $table->string('contact_phone')->nullable()->after('contact_email');
            $table->timestamp('auto_replied_at')->nullable()->after('contact_phone');
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['contact_email', 'contact_phone', 'auto_replied_at']);
        });
    }
};
