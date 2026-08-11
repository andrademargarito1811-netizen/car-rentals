<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferFleetPageSettingsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('fleet_page_settings')) {
            $this->command?->warn('prod fleet_page_settings table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('fleet_page_settings')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No fleet_page_settings rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('fleet_page_settings')->insertOrIgnore([
                'id' => $row->id,
                'hero_badge' => $row->hero_badge,
                'hero_title' => $row->hero_title,
                'hero_highlight' => $row->hero_highlight,
                'hero_description' => $row->hero_description,
                'hero_image_path' => $row->hero_image_path,
                'section_heading' => $row->section_heading,
                'section_subheading' => $row->section_subheading,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' fleet_page_settings row(s) from prod.');
    }
}
