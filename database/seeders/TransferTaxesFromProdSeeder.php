<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferTaxesFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('taxes')) {
            $this->command?->warn('prod taxes table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('taxes')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No taxes rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('taxes')->insertOrIgnore([
                'id' => $row->id,
                'tax_desc' => $row->tax_desc,
                'calculation' => $row->calculation,
                'category_id' => $row->category_id,
                'value_in' => $row->value_in,
                'add_or_minus' => $row->add_or_minus,
                'rate' => (float) $row->rate,
                'apply_always' => $row->apply_always,
                'location_id' => $row->location_id,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' taxes row(s) from prod.');
    }
}
