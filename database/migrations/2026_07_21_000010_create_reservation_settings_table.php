<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservation_settings', function (Blueprint $table) {
            $table->id();
            $table->string('badge_text', 255)->default('Palau Exclusive');
            $table->string('headline', 255)->default('Reserve Your');
            $table->string('headline_highlight', 255)->default('Ride');
            $table->text('subtitle')->nullable()->default('Complete the form below to secure your perfect vehicle. Palau-exclusive rentals for a truly unique experience.');
            $table->json('stat_pills')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::table('reservation_settings')->insert([
            'badge_text' => 'Palau Exclusive',
            'headline' => 'Reserve Your',
            'headline_highlight' => 'Ride',
            'subtitle' => 'Complete the form below to secure your perfect vehicle. Palau-exclusive rentals for a truly unique experience.',
            'stat_pills' => json_encode([
                ['icon' => 'location', 'text' => '2 Locations'],
                ['icon' => 'shield', 'text' => 'Fully Insured'],
                ['icon' => 'clock', 'text' => '25+ Drivers'],
            ]),
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('reservation_settings');
    }
};
