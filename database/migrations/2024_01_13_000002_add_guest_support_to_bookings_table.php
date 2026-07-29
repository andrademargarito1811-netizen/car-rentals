<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('bookings')) {
            return;
        }

        if (!Schema::hasColumn('bookings', 'guest_id')) {
            DB::statement('ALTER TABLE bookings ALTER COLUMN user_id bigint NULL');

            Schema::table('bookings', function (Blueprint $table) {
                $table->unsignedBigInteger('guest_id')->nullable()->after('user_id');
                $table->time('pickup_time')->nullable()->after('end_date');
                $table->time('return_time')->nullable()->after('pickup_time');
                $table->unsignedBigInteger('pickup_location_id')->nullable()->after('return_time');
                $table->unsignedBigInteger('return_location_id')->nullable()->after('pickup_location_id');

                $table->foreign('guest_id')->references('guest_id')->on('tblguests')->noActionOnDelete()->noActionOnUpdate();
                $table->foreign('pickup_location_id')->references('location_id')->on('tblvehicle_location')->noActionOnDelete()->noActionOnUpdate();
                $table->foreign('return_location_id')->references('location_id')->on('tblvehicle_location')->noActionOnDelete()->noActionOnUpdate();

                $table->index('guest_id', 'idx_bookings_guest');
                $table->index('pickup_location_id', 'idx_bookings_pickup_location');
                $table->index('return_location_id', 'idx_bookings_return_location');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign(['guest_id']);
            $table->dropForeign(['pickup_location_id']);
            $table->dropForeign(['return_location_id']);
            $table->dropIndex('idx_bookings_guest');
            $table->dropIndex('idx_bookings_pickup_location');
            $table->dropIndex('idx_bookings_return_location');
            $table->dropColumn(['guest_id', 'pickup_time', 'return_time', 'pickup_location_id', 'return_location_id']);
        });

        DB::statement('ALTER TABLE bookings ALTER COLUMN user_id bigint NOT NULL');
    }
};
