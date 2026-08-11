<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferAboutUsPageSettingsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('about_us_page_settings')) {
            $this->command?->warn('prod about_us_page_settings table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('about_us_page_settings')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No about_us_page_settings rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('about_us_page_settings')->insertOrIgnore([
                'id' => $row->id,
                'hero_badge' => $row->hero_badge,
                'hero_title' => $row->hero_title,
                'hero_highlight' => $row->hero_highlight,
                'hero_description' => $row->hero_description,
                'hero_image_path' => $row->hero_image_path,
                'story_heading' => $row->story_heading,
                'story_content' => $row->story_content,
                'story_image_path' => $row->story_image_path,
                'mission_text' => $row->mission_text,
                'vision_text' => $row->vision_text,
                'values' => $row->values,
                'team_members' => $row->team_members,
                'stats' => $row->stats,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' about_us_page_settings row(s) from prod.');
    }
}
