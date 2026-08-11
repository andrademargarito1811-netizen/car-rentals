<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferHeroImagesFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('hero_images')) {
            $this->command?->warn('prod hero_images table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('hero_images')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No hero_images rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('hero_images')->insertOrIgnore([
                'id' => $row->id,
                'hero_setting_id' => $row->hero_setting_id,
                'image_path' => $row->image_path,
                'tagline' => $row->tagline,
                'alt_text' => $row->alt_text,
                'sort_order' => $row->sort_order,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' hero_images row(s) from prod.');
    }
}
