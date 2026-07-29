<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->after('name');
            $table->string('profile_photo_path', 255)->nullable()->after('email');
            $table->date('date_of_birth')->nullable()->after('phone');
            $table->string('gender', 20)->nullable()->after('date_of_birth');
            $table->string('emergency_contact_name', 255)->nullable()->after('address');
            $table->string('emergency_contact_phone', 20)->nullable()->after('emergency_contact_name');
            $table->string('driver_license_number', 50)->nullable()->after('emergency_contact_phone');
            $table->date('driver_license_expiry')->nullable()->after('driver_license_number');
            $table->string('preferred_language', 10)->default('en')->after('driver_license_expiry');
            $table->string('timezone', 100)->nullable()->after('preferred_language');
            $table->text('notes')->nullable()->after('timezone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username',
                'profile_photo_path',
                'date_of_birth',
                'gender',
                'emergency_contact_name',
                'emergency_contact_phone',
                'driver_license_number',
                'driver_license_expiry',
                'preferred_language',
                'timezone',
                'notes',
            ]);
        });
    }
};
