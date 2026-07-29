<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reservation_settings', function (Blueprint $table) {
            $table->text('booking_terms')->nullable()->default(null);
        });

        DB::table('reservation_settings')->update([
            'booking_terms' => '<h3>Rental Terms &amp; Conditions</h3>
<ul>
<li>The primary driver must present a valid driver\'s license and a credit card in their name at the time of pick-up.</li>
<li>The vehicle must be returned with the same fuel level as at pick-up. A refueling charge applies otherwise.</li>
<li>Late returns are billed in hourly increments beyond the agreed return time and may incur additional fees.</li>
<li>Cancellations made at least 48 hours before pick-up are fully refundable. No-shows are non-refundable.</li>
<li>The renter is responsible for traffic violations, tolls, and fines incurred during the rental period.</li>
<li>Optional insurances are subject to tax in certain locations. This tax is not reflected in the Estimated Total shown.</li>
</ul>',
        ]);
    }

    public function down(): void
    {
        Schema::table('reservation_settings', function (Blueprint $table) {
            $table->dropColumn('booking_terms');
        });
    }
};
