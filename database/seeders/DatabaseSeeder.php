<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('tblvehicle_location')->count() === 0) {
            DB::table('tblvehicle_location')->insert([
                [
                    'location' => 'West Plaza Hotel @ Lebuu St.',
                    'address' => 'Lebuu St., Koror, Palau',
                    'subtitle' => 'West Plaza',
                    'city' => 'Koror',
                    'phone' => '+680 833-2211',
                    'hours' => "Monday: 9:00 AM - 6:00 PM\nTuesday: 9:00 AM - 6:00 PM\nWednesday: 9:00 AM - 6:00 PM\nThursday: 9:00 AM - 6:00 PM\nFriday: 9:00 AM - 6:00 PM\nSaturday: 9:00 AM - 5:00 PM\nSunday: Closed",
                    'lat' => 7.3434310,
                    'lng' => 134.4794690,
                    'description' => 'Located in the heart of Koror at West Plaza Hotel, our flagship branch offers convenient access to downtown shops, restaurants, and the scenic waterfront.',
                    'features' => json_encode(['Free WiFi', 'Parking Available', '24/7 Drop-off', 'Shuttle Service']),
                    'sort_order' => 1,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'location' => 'Airport',
                    'address' => 'Roman Tmetuchl International Airport, Palau',
                    'subtitle' => 'Airport',
                    'city' => 'Airai',
                    'phone' => '+680 587-8300',
                    'hours' => "Monday: 6:00 AM - 10:00 PM\nTuesday: 6:00 AM - 10:00 PM\nWednesday: 6:00 AM - 10:00 PM\nThursday: 6:00 AM - 10:00 PM\nFriday: 6:00 AM - 10:00 PM\nSaturday: 6:00 AM - 10:00 PM\nSunday: 6:00 AM - 10:00 PM",
                    'lat' => 7.3671810,
                    'lng' => 134.5430830,
                    'description' => 'Conveniently located at Roman Tmetuchl International Airport, perfect for travelers arriving in Palau. Pick up your rental car right after you land.',
                    'features' => json_encode(['Free WiFi', 'Parking Available', '24/7 Drop-off', 'Shuttle Service', 'Flight Tracking']),
                    'sort_order' => 2,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        if (DB::table('tblvehicle_classes')->count() === 0) {
            DB::table('tblvehicle_classes')->insert([
                ['class_no' => 'ECONOMY',     'class_desc' => 'Economy',        'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'REGULAR_SUV', 'class_desc' => 'Regular SUV',    'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'COMPACT',     'class_desc' => 'Compact',        'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['class_no' => 'FULLSIZE_VAN','class_desc' => 'Fullsize Van',   'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
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
                ['available_desc' => 'List on Site for Sale','is_active' => true, 'created_at' => now(), 'updated_at' => now()],
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
    }
}
