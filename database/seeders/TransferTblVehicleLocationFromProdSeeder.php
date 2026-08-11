<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferTblVehicleLocationFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('tblvehicle_location')) {
            $this->command?->warn('prod tblvehicle_location table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('tblvehicle_location')->orderBy('location_id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No tblvehicle_location rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('tblvehicle_location')->upsert([
                'location_id' => $row->location_id,
                'location' => $row->location,
                'address' => $row->address,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
                'subtitle' => $row->subtitle,
                'city' => $row->city,
                'phone' => $row->phone,
                'hours' => $row->hours,
                'lat' => $row->lat,
                'lng' => $row->lng,
                'image' => $row->image,
                'description' => $row->description,
                'features' => $row->features,
                'sort_order' => $row->sort_order,
            ], ['location_id']);
        }

        $ids = $rows->pluck('location_id')->all();

        $deleted = DB::table('tblvehicle_location')->whereNotIn('location_id', $ids)->delete();

        if ($deleted > 0) {
            $this->command?->info('Removed '.$deleted.' stale tblvehicle_location row(s) not present in prod.');
        }

        $this->command?->info('Upserted '.count($rows).' tblvehicle_location row(s) from prod.');
    }
}
