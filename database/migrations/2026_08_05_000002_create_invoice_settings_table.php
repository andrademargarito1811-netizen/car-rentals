<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 255)->default('West Car Rental');
            $table->string('company_legal_name', 255)->default('Western Caroline Trading Company Inc.');
            $table->string('phone', 255)->default('+1 (800) 555-WEST');
            $table->string('fax', 255)->nullable();
            $table->string('email', 255)->default('info@westcarsales.com');
            $table->string('logo_path', 255)->nullable()->default('/img/company_logo/company-logos-01.png');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('invoice_settings')->insert([
            'company_name' => 'West Car Rental',
            'company_legal_name' => 'Western Caroline Trading Company Inc.',
            'phone' => '+1 (800) 555-WEST',
            'fax' => null,
            'email' => 'info@westcarsales.com',
            'logo_path' => '/img/company_logo/company-logos-01.png',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_settings');
    }
};
