<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('legal_documents')
            ->where('slug', 'invoice-terms-online')
            ->update(['title' => 'Agreement Text - 1']);

        DB::table('legal_documents')
            ->where('slug', 'invoice-terms-walkin')
            ->update(['title' => 'Agreement Text - 2']);
    }

    public function down(): void
    {
        DB::table('legal_documents')
            ->where('slug', 'invoice-terms-online')
            ->update(['title' => 'Invoice Terms - Online Booking']);

        DB::table('legal_documents')
            ->where('slug', 'invoice-terms-walkin')
            ->update(['title' => 'Invoice Terms - Walk-In Rental']);
    }
};
