<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Throwable;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('tblvehicle_classes')->count() === 0) {
            DB::table('tblvehicle_classes')->insert([
                ['class_no' => 'ECONOMY',     'class_desc' => 'Economy',        'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'REGULAR_SUV', 'class_desc' => 'Regular SUV',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'COMPACT',     'class_desc' => 'Compact',        'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'FULLSIZE_VAN', 'class_desc' => 'Fullsize Van',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'FLATBEDS',    'class_desc' => 'FlatBeds',       'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'VANS',        'class_desc' => 'Vans',           'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'FULL_SUV',    'class_desc' => 'Full Size SUV',  'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'MIDSIZE_SUV', 'class_desc' => 'Midsize SUV',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (DB::table('tblvehicle_availability')->count() === 0) {
            DB::table('tblvehicle_availability')->insert([
                ['available_desc' => 'Available',           'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'Maintenance',         'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'Accident',            'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'Sold',                'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'Pending Sale',        'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'List on Site for Sale', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['available_desc' => 'Disposed',            'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (Faq::count() === 0) {
            Faq::insert([
                ['question' => 'What do I need to rent a car?', 'answer' => "You need a valid driver's license, a credit card in your name, and to be at least 25 years old. International visitors should bring a passport and an International Driving Permit if applicable.", 'category' => 'Requirements', 'popular' => true, 'is_active' => true, 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
                ['question' => 'Is insurance included in the rental price?', 'answer' => 'Basic insurance is included with every rental. You can also upgrade to our premium coverage for enhanced protection with zero deductible and roadside assistance.', 'category' => 'Insurance', 'popular' => true, 'is_active' => true, 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
                ['question' => 'Can I return the car to a different location?', 'answer' => 'Yes! We offer one-way rentals between all four of our locations. A small drop-off fee may apply depending on the locations selected.', 'category' => 'Pickup & Return', 'popular' => false, 'is_active' => true, 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
                ['question' => 'What is the fuel policy?', 'answer' => 'Our vehicles are provided with a full tank. We ask that you return the car with a full tank to avoid a refueling charge. Fuel service options are available at checkout.', 'category' => 'Policies', 'popular' => false, 'is_active' => true, 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
                ['question' => 'Can I add an additional driver?', 'answer' => 'Yes, additional drivers can be added for a small daily fee. They must meet the same requirements as the primary driver and be present at pickup to sign the agreement.', 'category' => 'Requirements', 'popular' => false, 'is_active' => true, 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
                ['question' => 'How do I modify or cancel my reservation?', 'answer' => 'You can modify or cancel your reservation up to 24 hours before your scheduled pickup at no charge. Contact our support team or manage your booking online.', 'category' => 'Reservations', 'popular' => true, 'is_active' => true, 'sort_order' => 6, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (Testimonial::count() === 0) {
            Testimonial::insert([
                ['name' => 'Sarah Johnson', 'role' => 'Business Traveler', 'content' => 'Absolutely seamless experience. The car was pristine and the service was outstanding.', 'rating' => 5, 'sort_order' => 0, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Michael Chen', 'role' => 'Family Vacation', 'content' => 'Best rental experience we have ever had. Affordable rates and excellent vehicles.', 'rating' => 5, 'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Emma Davis', 'role' => 'Weekend Explorer', 'content' => 'Quick pickup, great car, and hassle-free return. Will definitely use again!', 'rating' => 5, 'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        try {
            $this->call(TransferUsersFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod user transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferAboutUsPageSettingsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod about_us_page_settings transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferExtraChargesFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod extra_charges transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferFleetPageSettingsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod fleet_page_settings transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferHeroImagesFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod hero_images transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferHeroSettingsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod hero_settings transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferInvoiceSettingsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod invoice_settings transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferLegalDocumentsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod legal_documents transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferLocationsPageSettingsFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod locations_page_settings transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferReservationHeroImagesFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod reservation_hero_images transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferTblVehicleLocationFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod tblvehicle_location transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferTaxesFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod taxes transfer: '.$e->getMessage());
        }

        try {
            $this->call(TransferTaxVehicleClassFromProdSeeder::class);
        } catch (Throwable $e) {
            $this->command?->warn('Skipped prod tax_vehicle_class transfer: '.$e->getMessage());
        }
    }
}
