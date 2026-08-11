<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferInvoiceSettingsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('invoice_settings')) {
            $this->command?->warn('prod invoice_settings table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('invoice_settings')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No invoice_settings rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('invoice_settings')->upsert([
                'id' => $row->id,
                'company_name' => $row->company_name,
                'company_legal_name' => $row->company_legal_name,
                'phone' => $row->phone,
                'fax' => $row->fax,
                'email' => $row->email,
                'logo_path' => $row->logo_path,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
                'address' => $row->address,
                'tax_id' => $row->tax_id,
                'emergency_phone' => $row->emergency_phone,
            ], ['id']);
        }

        $this->command?->info('Upserted '.count($rows).' invoice_settings row(s) from prod.');
    }
}
