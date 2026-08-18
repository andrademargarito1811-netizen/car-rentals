<?php

namespace Database\Seeders;

use App\Models\Car;
use App\Models\VehicleAvailability;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DummyCarsSeeder extends Seeder
{
    public function run(): void
    {
        $imageSource = 'https://images.unsplash.com/%s?w=1200&q=80';

        $available = VehicleAvailability::where('available_desc', 'Available')->first();
        $availabilityId = $available?->available_id ?? 1;

        $vehicles = [
            [
                'brand' => 'Toyota', 'model' => 'Corolla', 'year' => 2022,
                'class_id' => 'COMPACT', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-COR-101', 'stock_number' => 'STK-TOY-101',
                'color' => 'Silver', 'seats' => 5, 'vehicle_doors' => 4, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.5,
                'daily_rate' => 55.00, 'air_conditioned' => true,
                'description' => 'Reliable compact sedan, perfect for city driving and island hopping.',
                'image_id' => 'photo-1541899481282-d53bffe3c35d',
            ],
            [
                'brand' => 'Toyota', 'model' => 'RAV4', 'year' => 2023,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-RAV-202', 'stock_number' => 'STK-TOY-202',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 7.2,
                'daily_rate' => 85.00, 'air_conditioned' => true,
                'description' => 'Popular compact SUV with plenty of space for families and luggage.',
                'image_id' => 'photo-1553440569-bcc63803a83d',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Land Cruiser Prado', 'year' => 2022,
                'class_id' => 'FULL_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-LCP-303', 'stock_number' => 'STK-TOY-303',
                'color' => 'Black', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 5,
                'transmission' => 'automatic', 'fuel_type' => 'diesel', 'fuel_consumption' => 9.8,
                'daily_rate' => 150.00, 'air_conditioned' => true,
                'description' => 'Rugged full-size SUV built to handle any terrain in comfort.',
                'image_id' => 'photo-1542362567-b07e54358753',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Hilux', 'year' => 2021,
                'class_id' => 'FLATBEDS', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-HLX-404', 'stock_number' => 'STK-TOY-404',
                'color' => 'Grey', 'seats' => 5, 'vehicle_doors' => 4, 'baggage_capacity' => 2,
                'transmission' => 'automatic', 'fuel_type' => 'diesel', 'fuel_consumption' => 8.5,
                'daily_rate' => 95.00, 'air_conditioned' => true,
                'description' => 'Durable pickup truck, ideal for work sites and rough roads.',
                'image_id' => 'photo-1560958089-b8a1929cea89',
            ],
            [
                'brand' => 'Toyota', 'model' => 'HiAce', 'year' => 2021,
                'class_id' => 'FULLSIZE_VAN', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-HIA-505', 'stock_number' => 'STK-TOY-505',
                'color' => 'White', 'seats' => 12, 'vehicle_doors' => 4, 'baggage_capacity' => 6,
                'transmission' => 'automatic', 'fuel_type' => 'diesel', 'fuel_consumption' => 9.0,
                'daily_rate' => 110.00, 'air_conditioned' => true,
                'description' => 'Spacious passenger van, great for group tours and airport transfers.',
                'image_id' => 'photo-1511919884226-fd3cad34687c',
            ],
            [
                'brand' => 'Honda', 'model' => 'Civic', 'year' => 2022,
                'class_id' => 'COMPACT', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-CIV-601', 'stock_number' => 'STK-HON-601',
                'color' => 'Red', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.0,
                'daily_rate' => 60.00, 'air_conditioned' => true,
                'description' => 'Fun-to-drive compact with a sporty feel and great fuel economy.',
                'image_id' => 'photo-1502877338535-766e1452684a',
            ],
            [
                'brand' => 'Honda', 'model' => 'CR-V', 'year' => 2023,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-CRV-702', 'stock_number' => 'STK-HON-702',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 7.0,
                'daily_rate' => 80.00, 'air_conditioned' => true,
                'description' => 'Refined midsize SUV with a roomy cabin and smooth ride.',
                'image_id' => 'photo-1571607388263-1044f9ea01dd',
            ],
            [
                'brand' => 'Honda', 'model' => 'HR-V', 'year' => 2022,
                'class_id' => 'REGULAR_SUV', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-HRV-803', 'stock_number' => 'STK-HON-803',
                'color' => 'Blue', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.8,
                'daily_rate' => 75.00, 'air_conditioned' => true,
                'description' => 'Compact crossover that balances style, space, and efficiency.',
                'image_id' => 'photo-1568605117036-5fe5e7bab0b7',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Swift', 'year' => 2021,
                'class_id' => 'ECONOMY', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-SWF-901', 'stock_number' => 'STK-SUZ-901',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 2,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 5.5,
                'daily_rate' => 45.00, 'air_conditioned' => true,
                'description' => 'Lightweight hatchback, cheap to run and easy to park.',
                'image_id' => 'photo-1533473359331-0135ef1b58bf',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Carry', 'year' => 2020,
                'class_id' => 'VANS', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-CAR-010', 'stock_number' => 'STK-SUZ-010',
                'color' => 'Silver', 'seats' => 2, 'vehicle_doors' => 2, 'baggage_capacity' => 2,
                'transmission' => 'manual', 'fuel_type' => 'gasoline', 'fuel_consumption' => 7.5,
                'daily_rate' => 40.00, 'air_conditioned' => false,
                'description' => 'Compact utility van for light cargo and small deliveries.',
                'image_id' => 'photo-1590362891991-f776e747a588',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Camry', 'year' => 2023,
                'class_id' => 'COMPACT', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-CAM-111', 'stock_number' => 'STK-TOY-111',
                'color' => 'Silver', 'seats' => 5, 'vehicle_doors' => 4, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.3,
                'daily_rate' => 65.00, 'air_conditioned' => true,
                'description' => 'Comfortable midsize sedan, smooth on highways and around town.',
                'image_id' => 'photo-1555215695-3004980ad54e',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Corolla Cross', 'year' => 2023,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-CRC-222', 'stock_number' => 'STK-TOY-222',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.8,
                'daily_rate' => 82.00, 'air_conditioned' => true,
                'description' => 'The rugged sibling of the Corolla, built for island roads.',
                'image_id' => 'photo-1533106418989-88406c7cc8ca',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Highlander', 'year' => 2022,
                'class_id' => 'FULL_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-HIG-333', 'stock_number' => 'STK-TOY-333',
                'color' => 'Black', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 5,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 8.4,
                'daily_rate' => 130.00, 'air_conditioned' => true,
                'description' => 'Three-row family SUV with a premium, quiet cabin.',
                'image_id' => 'photo-1552930294-6b595f4c2974',
            ],
            [
                'brand' => 'Toyota', 'model' => '4Runner', 'year' => 2021,
                'class_id' => 'FULL_SUV', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-4RN-444', 'stock_number' => 'STK-TOY-444',
                'color' => 'Grey', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 5,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 10.0,
                'daily_rate' => 140.00, 'air_conditioned' => true,
                'description' => 'Legendary off-roader with serious capability.',
                'image_id' => 'photo-1549399542-7e3f8b79c341',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Tacoma', 'year' => 2022,
                'class_id' => 'FLATBEDS', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-TAC-555', 'stock_number' => 'STK-TOY-555',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 4, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 9.2,
                'daily_rate' => 100.00, 'air_conditioned' => true,
                'description' => 'Mid-size pickup ready for hauling gear and cargo.',
                'image_id' => 'photo-1583267746897-2cf415887172',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Sienna', 'year' => 2022,
                'class_id' => 'FULLSIZE_VAN', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-SIE-666', 'stock_number' => 'STK-TOY-666',
                'color' => 'Silver', 'seats' => 8, 'vehicle_doors' => 5, 'baggage_capacity' => 6,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 8.0,
                'daily_rate' => 105.00, 'air_conditioned' => true,
                'description' => 'Family minivan with sliding doors and tons of space.',
                'image_id' => 'photo-1592198084033-aade902d1aae',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Yaris', 'year' => 2021,
                'class_id' => 'ECONOMY', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-YAR-777', 'stock_number' => 'STK-TOY-777',
                'color' => 'Red', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 2,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 5.2,
                'daily_rate' => 48.00, 'air_conditioned' => true,
                'description' => 'Tiny, nimble hatchback that sips fuel.',
                'image_id' => 'photo-1618843479313-40f8afb4b4d8',
            ],
            [
                'brand' => 'Toyota', 'model' => 'Fortuner', 'year' => 2022,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'TOY-FOR-888', 'stock_number' => 'STK-TOY-888',
                'color' => 'White', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'diesel', 'fuel_consumption' => 8.8,
                'daily_rate' => 120.00, 'air_conditioned' => true,
                'description' => 'Robust seven-seat SUV for off-road and family trips.',
                'image_id' => 'photo-1621007947382-bb3c3994e3fb',
            ],
            [
                'brand' => 'Honda', 'model' => 'Accord', 'year' => 2023,
                'class_id' => 'COMPACT', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-ACC-121', 'stock_number' => 'STK-HON-121',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 4, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.5,
                'daily_rate' => 70.00, 'air_conditioned' => true,
                'description' => 'Upscale sedan with a refined ride and big trunk.',
                'image_id' => 'photo-1605559424843-9e4c228bf1c2',
            ],
            [
                'brand' => 'Honda', 'model' => 'Fit', 'year' => 2021,
                'class_id' => 'ECONOMY', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-FIT-232', 'stock_number' => 'STK-HON-232',
                'color' => 'Blue', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 5.8,
                'daily_rate' => 50.00, 'air_conditioned' => true,
                'description' => 'Magical space, tiny footprint — the ultimate city car.',
                'image_id' => 'photo-1606016159991-dfe4f2746ad5',
            ],
            [
                'brand' => 'Honda', 'model' => 'Pilot', 'year' => 2022,
                'class_id' => 'FULL_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-PIL-343', 'stock_number' => 'STK-HON-343',
                'color' => 'Black', 'seats' => 8, 'vehicle_doors' => 5, 'baggage_capacity' => 5,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 9.5,
                'daily_rate' => 125.00, 'air_conditioned' => true,
                'description' => 'Spacious three-row SUV that seats the whole group.',
                'image_id' => 'photo-1617531653332-bd46c24f2068',
            ],
            [
                'brand' => 'Honda', 'model' => 'Odyssey', 'year' => 2021,
                'class_id' => 'FULLSIZE_VAN', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-ODY-454', 'stock_number' => 'STK-HON-454',
                'color' => 'Silver', 'seats' => 8, 'vehicle_doors' => 5, 'baggage_capacity' => 6,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 8.5,
                'daily_rate' => 108.00, 'air_conditioned' => true,
                'description' => 'Comfortable minivan perfect for families and shuttles.',
                'image_id' => 'photo-1567818735868-e71b99932e29',
            ],
            [
                'brand' => 'Honda', 'model' => 'BR-V', 'year' => 2022,
                'class_id' => 'REGULAR_SUV', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-BRV-565', 'stock_number' => 'STK-HON-565',
                'color' => 'White', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.9,
                'daily_rate' => 78.00, 'air_conditioned' => true,
                'description' => 'Compact seven-seater that combines value and versatility.',
                'image_id' => 'photo-1580273916550-e323be2ae537',
            ],
            [
                'brand' => 'Honda', 'model' => 'Passport', 'year' => 2022,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'HON-PAS-676', 'stock_number' => 'STK-HON-676',
                'color' => 'Grey', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 8.8,
                'daily_rate' => 115.00, 'air_conditioned' => true,
                'description' => 'Adventure-oriented two-row SUV with tough styling.',
                'image_id' => 'photo-1519245659620-e859806a8d3b',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Alto', 'year' => 2021,
                'class_id' => 'ECONOMY', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-ALT-101', 'stock_number' => 'STK-SUZ-101',
                'color' => 'White', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 2,
                'transmission' => 'manual', 'fuel_type' => 'gasoline', 'fuel_consumption' => 4.9,
                'daily_rate' => 38.00, 'air_conditioned' => true,
                'description' => 'Super-affordable city kei car with amazing economy.',
                'image_id' => 'photo-1607853202273-797f1c22a38e',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Baleno', 'year' => 2022,
                'class_id' => 'COMPACT', 'location_id' => 4, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-BAL-212', 'stock_number' => 'STK-SUZ-212',
                'color' => 'Silver', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 3,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 5.5,
                'daily_rate' => 52.00, 'air_conditioned' => true,
                'description' => 'Spacious hatchback with a surprising amount of tech.',
                'image_id' => 'photo-1532581140115-3e355d1ed1de',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Celerio', 'year' => 2021,
                'class_id' => 'ECONOMY', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-CEL-323', 'stock_number' => 'STK-SUZ-323',
                'color' => 'Red', 'seats' => 5, 'vehicle_doors' => 5, 'baggage_capacity' => 2,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 5.0,
                'daily_rate' => 42.00, 'air_conditioned' => true,
                'description' => 'Cheerful hatchback with great value per mile.',
                'image_id' => 'photo-1606664515524-ed2f786a0bd6',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'Ertiga', 'year' => 2022,
                'class_id' => 'VANS', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-ERT-434', 'stock_number' => 'STK-SUZ-434',
                'color' => 'White', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.5,
                'daily_rate' => 72.00, 'air_conditioned' => true,
                'description' => 'Seven-seat MPV that is roomy and easy to drive.',
                'image_id' => 'photo-1593941707882-a5bba14938c7',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'APV', 'year' => 2020,
                'class_id' => 'VANS', 'location_id' => 5, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-APV-545', 'stock_number' => 'STK-SUZ-545',
                'color' => 'Grey', 'seats' => 8, 'vehicle_doors' => 4, 'baggage_capacity' => 5,
                'transmission' => 'manual', 'fuel_type' => 'gasoline', 'fuel_consumption' => 7.8,
                'daily_rate' => 58.00, 'air_conditioned' => true,
                'description' => 'Practical people mover for groups and day trips.',
                'image_id' => 'photo-1580274455191-1c62238fa333',
            ],
            [
                'brand' => 'Suzuki', 'model' => 'XL7', 'year' => 2023,
                'class_id' => 'MIDSIZE_SUV', 'location_id' => 3, 'availability_id' => $availabilityId,
                'license_plate' => 'SUZ-XL7-656', 'stock_number' => 'STK-SUZ-656',
                'color' => 'Black', 'seats' => 7, 'vehicle_doors' => 5, 'baggage_capacity' => 4,
                'transmission' => 'automatic', 'fuel_type' => 'gasoline', 'fuel_consumption' => 6.8,
                'daily_rate' => 88.00, 'air_conditioned' => true,
                'description' => 'Modern seven-seat SUV with a bold front end.',
                'image_id' => 'photo-1552346154-21d32810aba3',
            ],
        ];

        foreach ($vehicles as $vehicle) {
            if (Car::where('license_plate', $vehicle['license_plate'])->exists()) {
                continue;
            }

            $imageId = $vehicle['image_id'];
            $extension = 'jpg';
            $filename = Str::random(40).'.'.$extension;
            $path = 'cars/'.$filename;

            if (!Storage::disk('public')->exists($path)) {
                $response = Http::timeout(30)
                    ->withOptions(['verify' => false])
                    ->get(sprintf($imageSource, $imageId));

                if ($response->successful()) {
                    Storage::disk('public')->put($path, $response->body());
                }
            }

            unset($vehicle['image_id']);

            $vehicle['stock_number'] = $vehicle['stock_number'].'-'.Str::upper(Str::random(4));
            $vehicle['vin'] = strtoupper(substr(hash('sha256', $vehicle['license_plate'].Str::random(8)), 0, 17));
            $vehicle['engine'] = match ($vehicle['fuel_type']) {
                'diesel' => '2.4L Diesel',
                default => '1.5L Petrol',
            };
            $vehicle['fuel_charges'] = 60.00;
            $vehicle['co2_emission'] = match ($vehicle['fuel_type']) {
                'diesel' => 175,
                default => 120,
            };
            $vehicle['maximum_weight'] = 300.00;
            $vehicle['image_path'] = $path;
            $vehicle['created_at'] = now();
            $vehicle['updated_at'] = now();

            Car::create($vehicle);
        }
    }
}
