<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Static snapshot of reference/settings data taken from the production
 * (MSSQL Car_Rentals) database. The values below were copied verbatim so this
 * environment never needs to reach the production server.
 */
class SnapshotReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRows('users', [
            ['id' => '1', 'name' => 'Admin', 'email' => 'admin@carrentals.com', 'email_verified_at' => null, 'password' => '$2y$12$erDh1YL9x3HiZiueZsFoz.HkREUJ8dF.e2PJlj6/V5yH4ctC0C59y', 'remember_token' => null, 'phone' => null, 'address' => null, 'role' => 'admin', 'status' => 'active', 'two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null, 'created_at' => '2026-07-23 14:17:08', 'updated_at' => '2026-07-23 14:18:04', 'username' => 'admin', 'profile_photo_path' => null, 'date_of_birth' => null, 'gender' => null, 'emergency_contact_name' => null, 'emergency_contact_phone' => null, 'driver_license_number' => null, 'driver_license_expiry' => null, 'preferred_language' => 'en', 'timezone' => null, 'notes' => null, 'last_active_at' => null],
            ['id' => '2', 'name' => 'Jayr Andrade', 'email' => 'tetsuyakuroko1118@gmail.com', 'email_verified_at' => null, 'password' => '$2y$12$qdTBmu3g3bDdMwWCnYM9R.37weWMnPy.YOC1Gi02kcdvLsTFOPDim', 'remember_token' => null, 'phone' => null, 'address' => null, 'role' => 'admin', 'status' => 'active', 'two_factor_secret' => null, 'two_factor_recovery_codes' => null, 'two_factor_confirmed_at' => null, 'created_at' => '2026-07-24 14:59:00', 'updated_at' => '2026-07-24 14:59:00', 'username' => 'tetsuya1811', 'profile_photo_path' => null, 'date_of_birth' => '1996-04-17', 'gender' => 'male', 'emergency_contact_name' => null, 'emergency_contact_phone' => null, 'driver_license_number' => null, 'driver_license_expiry' => null, 'preferred_language' => 'en', 'timezone' => null, 'notes' => null, 'last_active_at' => null],
        ]);

        $this->seedRows('taxes', [
            ['id' => '1', 'tax_desc' => 'Palau Goods Service Tax (PGST)', 'calculation' => 'Per Day', 'category_id' => '2', 'value_in' => 'Percentage', 'add_or_minus' => '1', 'rate' => '10.00', 'apply_always' => '1', 'location_id' => null, 'is_active' => '1', 'created_at' => '2026-07-23 14:25:10', 'updated_at' => '2026-07-23 14:25:10'],
        ]);

        $this->seedRows('tax_vehicle_class', [
            ['tax_id' => '1', 'class_no' => 'COMPACT'],
            ['tax_id' => '1', 'class_no' => 'ECONOMY'],
            ['tax_id' => '1', 'class_no' => 'FLATBEDS'],
            ['tax_id' => '1', 'class_no' => 'FULL_SUV'],
            ['tax_id' => '1', 'class_no' => 'FULLSIZE_VAN'],
            ['tax_id' => '1', 'class_no' => 'MIDSIZE_SUV'],
            ['tax_id' => '1', 'class_no' => 'REGULAR_SUV'],
            ['tax_id' => '1', 'class_no' => 'VANS'],
        ]);

        $this->seedRows('extra_charges', [
            ['id' => '2', 'name' => 'Fuel', 'type' => 'Extra Charge', 'calculation' => 'Fixed', 'value_in' => 'Amount', 'operator' => '+', 'rate' => '.00', 'taxable' => '1', 'apply_always' => '0', 'is_active' => '1', 'created_at' => '2026-08-08 10:58:29', 'updated_at' => '2026-08-08 10:58:29'],
            ['id' => '3', 'name' => 'Parts', 'type' => 'Extra Charge', 'calculation' => 'Fixed', 'value_in' => 'Amount', 'operator' => '+', 'rate' => '.00', 'taxable' => '1', 'apply_always' => '0', 'is_active' => '1', 'created_at' => '2026-08-08 10:58:52', 'updated_at' => '2026-08-08 10:58:52'],
            ['id' => '4', 'name' => 'Damage', 'type' => 'Extra Charge', 'calculation' => 'Fixed', 'value_in' => 'Amount', 'operator' => '+', 'rate' => '.00', 'taxable' => '1', 'apply_always' => '0', 'is_active' => '1', 'created_at' => '2026-08-08 10:59:01', 'updated_at' => '2026-08-08 10:59:01'],
            ['id' => '5', 'name' => 'CDW', 'type' => 'Extra Charge', 'calculation' => 'Per Day', 'value_in' => 'Amount', 'operator' => '+', 'rate' => '.00', 'taxable' => '0', 'apply_always' => '0', 'is_active' => '1', 'created_at' => '2026-08-08 11:00:59', 'updated_at' => '2026-08-08 11:01:24'],
        ]);

        $this->seedRows('coupons', [
            ['id' => '1', 'code' => 'YFS3RXVX5QAA2LM5', 'issued_by' => 'test', 'start_date' => '2026-07-01', 'end_date' => '2026-07-31', 'min_order' => null, 'max_uses' => null, 'user_count' => '0', 'coupon_type_id' => '2', 'min_rate' => '10.00', 'is_active' => '1', 'created_at' => '2026-07-23 15:25:33', 'updated_at' => '2026-07-23 15:25:33'],
            ['id' => '3', 'code' => 'O2XDECFNTMUIT7BU', 'issued_by' => 'test', 'start_date' => null, 'end_date' => null, 'min_order' => null, 'max_uses' => null, 'user_count' => '0', 'coupon_type_id' => '2', 'min_rate' => '5.00', 'is_active' => '1', 'created_at' => '2026-07-24 09:16:08', 'updated_at' => '2026-08-05 11:09:58'],
        ]);

        $this->seedRows('hero_images', [
            ['id' => '1', 'hero_setting_id' => '1', 'image_path' => 'hero/carousel/carousel-1.jpg', 'tagline' => 'Find Your Perfect Ride', 'alt_text' => 'Classic muscle car on road', 'sort_order' => '1', 'created_at' => '2026-07-23 14:22:22', 'updated_at' => '2026-07-30 09:39:51'],
            ['id' => '2', 'hero_setting_id' => '1', 'image_path' => 'hero/carousel/carousel-2.jpg', 'tagline' => 'Explore in Style', 'alt_text' => 'Red sports car on mountain road', 'sort_order' => '2', 'created_at' => '2026-07-23 14:22:22', 'updated_at' => '2026-07-30 09:39:51'],
            ['id' => '3', 'hero_setting_id' => '1', 'image_path' => 'hero/carousel/VqdFPrzX0Fpx61DPwnSzJvcFqhTQ63KLK9AungOq.jpg', 'tagline' => 'Adventure Awaits', 'alt_text' => 'Muscle car on open highway', 'sort_order' => '0', 'created_at' => '2026-07-23 14:22:22', 'updated_at' => '2026-07-30 09:39:51'],
            ['id' => '4', 'hero_setting_id' => '1', 'image_path' => 'hero/carousel/weCiYQABueTPIIcpQafjVkAM5RUgC2EyzC3nIkQ9.jpg', 'tagline' => 'Drive the Extra Mile', 'alt_text' => 'SUV on scenic mountain road', 'sort_order' => '4', 'created_at' => '2026-07-23 14:22:22', 'updated_at' => '2026-07-30 09:39:51'],
            ['id' => '5', 'hero_setting_id' => '1', 'image_path' => 'hero/carousel/GhM51mNSSNUSNcVzLlBNVCU5uXjjI4ZW6vV5QhBZ.jpg', 'tagline' => 'Your Journey Begins Here', 'alt_text' => 'Sports car on winding road', 'sort_order' => '3', 'created_at' => '2026-07-23 14:22:22', 'updated_at' => '2026-07-30 09:39:51'],
        ]);

        $this->seedRows('reservation_hero_images', [
            ['id' => '1', 'reservation_setting_id' => '1', 'image_path' => 'hero/carousel/reservation-hero-1.jpg', 'alt_text' => 'Palau Beach', 'caption' => 'Crystal Clear Waters', 'sort_order' => '1', 'created_at' => '2026-07-23 14:28:35', 'updated_at' => '2026-07-23 14:28:35'],
            ['id' => '2', 'reservation_setting_id' => '1', 'image_path' => 'hero/carousel/reservation-hero-2.jpg', 'alt_text' => 'Tropical Ocean', 'caption' => 'Pristine Coral Reefs', 'sort_order' => '2', 'created_at' => '2026-07-23 14:28:35', 'updated_at' => '2026-07-23 14:28:35'],
            ['id' => '5', 'reservation_setting_id' => '1', 'image_path' => 'reservation-hero/HYLqxzaZY4wJM6caHm8cttfAJIjmJ7YhV0xXiOzr.jpg', 'alt_text' => 'Rock Island', 'caption' => 'Rock Island', 'sort_order' => '3', 'created_at' => '2026-08-01 09:52:19', 'updated_at' => '2026-08-01 09:52:19'],
        ]);

        $this->seedRows('about_us_page_settings', [
            array_merge([
                'id' => '1',
                'hero_badge' => 'About Us',
                'hero_title' => 'Our Story',
                'hero_highlight' => 'Driven by Excellence',
                'hero_description' => "We're more than a car rental company - we're your trusted partner for every mile of your journey",
                'hero_image_path' => 'about-us-page/uxyzjSmKki3X8eAupvmu7Fy1SaihLME7HTq3tGpt.jpg',
                'story_heading' => 'Our Journey',
                'story_content' => "West Car Rental was founded with a simple mission: to provide travelers with reliable, affordable vehicles and exceptional service. What started as a small family-owned operation has grown into a trusted name in car rentals across the region.\n\nToday, we operate from 4 convenient locations with a fleet of over 500 vehicles, serving thousands of satisfied customers every year. Our commitment to quality, transparency, and customer satisfaction remains at the heart of everything we do.",
                'mission_text' => 'To provide reliable, safe, and well-maintained vehicles with exceptional customer service, making transportation in Palau convenient, affordable, and hassle-free for residents, visitors, and business travelers.',
                'vision_text' => "To be Palau's most trusted and customer-focused car rental company, recognized for reliable vehicles, excellent service, innovative rental solutions, and a seamless experience from reservation to vehicle return.",
                'is_active' => '1',
                'created_at' => '2026-07-30 08:52:09',
                'updated_at' => '2026-08-10 15:59:48',
                'story_image_path' => 'about-us-page/story/0EQO8XY4VVBseY7YLBptW1AzkxtZzKNkV3pMB5Ts.jpg',
            ], $this->jsonFields([
                'stats' => [
                    ['value' => '500+', 'label' => 'Vehicles in Fleet'],
                    ['value' => '4', 'label' => 'Convenient Locations'],
                    ['value' => '98%', 'label' => 'Customer Satisfaction'],
                    ['value' => '10+', 'label' => 'Years of Service'],
                ],
                'values' => [
                    ['icon' => 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 'title' => 'Reliability', 'description' => 'Every vehicle undergoes rigorous inspection and maintenance to ensure your safety and peace of mind on every journey.', 'color' => 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20'],
                    ['icon' => 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'title' => 'Transparency', 'description' => 'No hidden fees, no surprises. We believe in clear pricing and honest communication with every customer.', 'color' => 'bg-blue-500/10 text-blue-600 ring-blue-500/20'],
                    ['icon' => 'M13 10V3L4 14h7v7l9-11h-7z', 'title' => 'Speed & Efficiency', 'description' => "From online booking to key handover, we've streamlined every step to get you on the road faster.", 'color' => 'bg-amber-500/10 text-amber-600 ring-amber-500/20'],
                    ['icon' => 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'title' => '24/7 Support', 'description' => 'Our dedicated support team is available around the clock to assist you, wherever the road takes you.', 'color' => 'bg-violet-500/10 text-violet-600 ring-violet-500/20'],
                ],
                'team_members' => [
                    ['name' => 'Sarah Mitchell', 'role' => 'Founder & CEO', 'image_path' => 'https://ui-avatars.com/api/?name=Sarah+Mitchell&background=1e293b&color=fff&size=128'],
                    ['name' => 'James Rodriguez', 'role' => 'Operations Director', 'image_path' => 'https://ui-avatars.com/api/?name=James+Rodriguez&background=334155&color=fff&size=128'],
                    ['name' => 'Emily Chen', 'role' => 'Customer Experience Lead', 'image_path' => 'https://ui-avatars.com/api/?name=Emily+Chen&background=475569&color=fff&size=128'],
                    ['name' => 'Michael Thompson', 'role' => 'Fleet Manager', 'image_path' => 'https://ui-avatars.com/api/?name=Michael+Thompson&background=1e293b&color=fff&size=128'],
                ],
            ])),
        ]);

        $this->seedRows('fleet_page_settings', [
            ['id' => '1', 'hero_badge' => 'Browse Our Fleet', 'hero_title' => 'Explore Our', 'hero_highlight' => 'Premium Fleet', 'hero_description' => 'Choose from our wide selection of premium vehicles', 'hero_image_path' => 'fleet-page/kkYc7ZrtEGZ6V3QZTzzHsCj4pSEwlh5K9vKxPqqZ.jpg', 'section_heading' => 'Find Your Perfect Drive', 'section_subheading' => 'Choose from our wide selection of premium vehicles', 'is_active' => '1', 'created_at' => '2026-07-30 08:50:37', 'updated_at' => '2026-07-31 11:21:02'],
        ]);

        $this->seedRows('tblvehicle_location', [
            [
                'location_id' => '3',
                'location' => 'West Plaza Hotel @ Lebuu St.',
                'address' => 'Lebuu St., Koror, Palau',
                'is_active' => '1',
                'created_at' => '2026-07-23 14:32:26',
                'updated_at' => '2026-07-23 14:32:26',
                'subtitle' => 'West Plaza',
                'city' => 'Koror',
                'phone' => '+680 833-2211',
                'hours' => "Monday: 9:00 AM - 6:00 PM\nTuesday: 9:00 AM - 6:00 PM\nWednesday: 9:00 AM - 6:00 PM\nThursday: 9:00 AM - 6:00 PM\nFriday: 9:00 AM - 6:00 PM\nSaturday: 9:00 AM - 5:00 PM\nSunday: Closed",
                'lat' => '7.3434310',
                'lng' => '134.4794690',
                'image' => 'locations/location-westplaza.jpg',
                'description' => 'Located in the heart of Koror at West Plaza Hotel, our flagship branch offers convenient access to downtown shops, restaurants, and the scenic waterfront.',
                'features' => json_encode(['Free WiFi', 'Parking Available', '24/7 Drop-off', 'Shuttle Service'], JSON_UNESCAPED_SLASHES),
                'sort_order' => '1',
            ],
            [
                'location_id' => '4',
                'location' => 'Airport',
                'address' => 'Roman Tmetuchl International Airport, Palau',
                'is_active' => '1',
                'created_at' => '2026-07-23 14:32:26',
                'updated_at' => '2026-07-23 14:32:26',
                'subtitle' => 'Airport',
                'city' => 'Airai',
                'phone' => '+680 587-8300',
                'hours' => "Monday: 6:00 AM - 10:00 PM\nTuesday: 6:00 AM - 10:00 PM\nWednesday: 6:00 AM - 10:00 PM\nThursday: 6:00 AM - 10:00 PM\nFriday: 6:00 AM - 10:00 PM\nSaturday: 6:00 AM - 10:00 PM\nSunday: 6:00 AM - 10:00 PM",
                'lat' => '7.3671810',
                'lng' => '134.5430830',
                'image' => 'locations/location-airport.jpg',
                'description' => 'Conveniently located at Roman Tmetuchl International Airport, perfect for travelers arriving in Palau. Pick up your rental car right after you land.',
                'features' => json_encode(['Free WiFi', 'Parking Available', '24/7 Drop-off', 'Shuttle Service', 'Flight Tracking'], JSON_UNESCAPED_SLASHES),
                'sort_order' => '2',
            ],
        ]);
    }

    /**
     * Insert a table's snapshot rows only when they are not already present,
     * preserving the exact primary keys copied from production so related rows
     * (e.g. tax_vehicle_class → taxes) keep their links intact.
     */
    private function seedRows(string $table, array $rows): void
    {
        foreach ($rows as $row) {
            DB::table($table)->insertOrIgnore($row);
        }

        $this->command?->info("Seeded ".count($rows).' '.$table.' row(s) from snapshot.');
    }

    /**
     * Encode array-cast columns as valid JSON (MySQL json columns reject the
     * raw escaped text found in the legacy SQL Server snapshot).
     */
    private function jsonFields(array $fields): array
    {
        return array_map(fn ($value) => json_encode($value, JSON_UNESCAPED_SLASHES), $fields);
    }
}
