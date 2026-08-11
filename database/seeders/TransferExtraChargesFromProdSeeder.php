<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferExtraChargesFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('extra_charges')) {
            $this->command?->warn('prod extra_charges table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('extra_charges')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No extra_charges rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('extra_charges')->insertOrIgnore([
                'id' => $row->id,
                'name' => $row->name,
                'type' => $row->type,
                'calculation' => $row->calculation,
                'value_in' => $row->value_in,
                'operator' => $row->operator,
                'rate' => (float) $row->rate,
                'taxable' => $row->taxable,
                'apply_always' => $row->apply_always,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' extra_charges row(s) from prod.');
    }
}
