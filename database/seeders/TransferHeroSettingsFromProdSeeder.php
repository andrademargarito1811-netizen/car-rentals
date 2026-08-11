<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferHeroSettingsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('hero_settings')) {
            $this->command?->warn('prod hero_settings table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('hero_settings')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No hero_settings rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('hero_settings')->upsert([
                'id' => $row->id,
                'badge_text' => $row->badge_text,
                'headline' => $row->headline,
                'headline_highlight' => $row->headline_highlight,
                'tagline' => $row->tagline,
                'description' => $row->description,
                'image_path' => $row->image_path,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
                'fleet_image_path' => $row->fleet_image_path,
                'badge_enabled' => $row->badge_enabled,
                'badge_icon' => $row->badge_icon,
                'booking_badge_text' => $row->booking_badge_text,
                'booking_badge_enabled' => $row->booking_badge_enabled,
                'booking_badge_icon' => $row->booking_badge_icon,
                'why_choose_us_heading' => $row->why_choose_us_heading,
                'why_choose_us_subheading' => $row->why_choose_us_subheading,
            ], ['id']);
        }

        $this->command?->info('Upserted '.count($rows).' hero_settings row(s) from prod.');
    }
}
