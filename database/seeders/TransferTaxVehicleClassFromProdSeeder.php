<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferTaxVehicleClassFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('tax_vehicle_class')) {
            $this->command?->warn('prod tax_vehicle_class table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('tax_vehicle_class')->orderBy('tax_id')->orderBy('class_no')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No tax_vehicle_class rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('tax_vehicle_class')->insertOrIgnore([
                'tax_id' => $row->tax_id,
                'class_no' => $row->class_no,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' tax_vehicle_class row(s) from prod.');
    }
}
