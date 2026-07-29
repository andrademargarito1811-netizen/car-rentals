<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->index(['car_id', 'status', 'start_date', 'end_date'], 'idx_bookings_car_status_dates');
            $table->index('user_id', 'idx_bookings_user_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->index(['conversation_id', 'read_at', 'sender_type', 'is_internal'], 'idx_messages_conversation_read');
            $table->index('created_at', 'idx_messages_created_at');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->index(['status', 'updated_at'], 'idx_conversations_status_updated');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index('user_id', 'idx_audit_logs_user_id');
            $table->index(['action', 'created_at'], 'idx_audit_logs_action_created');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('booking_id', 'idx_payments_booking_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropIndex('idx_bookings_car_status_dates');
            $table->dropIndex('idx_bookings_user_id');
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_conversation_read');
            $table->dropIndex('idx_messages_created_at');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex('idx_conversations_status_updated');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_user_id');
            $table->dropIndex('idx_audit_logs_action_created');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_booking_id');
        });
    }
};
