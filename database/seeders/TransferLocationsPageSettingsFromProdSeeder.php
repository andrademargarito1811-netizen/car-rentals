<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferLocationsPageSettingsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('locations_page_settings')) {
            $this->command?->warn('prod locations_page_settings table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('locations_page_settings')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No locations_page_settings rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('locations_page_settings')->upsert([
                'id' => $row->id,
                'hero_badge' => $row->hero_badge,
                'hero_title' => $row->hero_title,
                'hero_highlight' => $row->hero_highlight,
                'hero_description' => $row->hero_description,
                'hero_image_path' => $row->hero_image_path,
                'hero_button_text' => $row->hero_button_text,
                'hero_phone_label' => $row->hero_phone_label,
                'hero_phone_number' => $row->hero_phone_number,
                'hero_active' => $row->hero_active,
                'cta_title' => $row->cta_title,
                'cta_description' => $row->cta_description,
                'cta_button_text' => $row->cta_button_text,
                'cta_button_url' => $row->cta_button_url,
                'cta_phone_label' => $row->cta_phone_label,
                'cta_phone_number' => $row->cta_phone_number,
                'cta_active' => $row->cta_active,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
                'hero_badge_active' => $row->hero_badge_active,
            ], ['id']);
        }

        $this->command?->info('Upserted '.count($rows).' locations_page_settings row(s) from prod.');
    }
}
