<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferReservationHeroImagesFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('reservation_hero_images')) {
            $this->command?->warn('prod reservation_hero_images table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('reservation_hero_images')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No reservation_hero_images rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('reservation_hero_images')->insertOrIgnore([
                'id' => $row->id,
                'reservation_setting_id' => $row->reservation_setting_id,
                'image_path' => $row->image_path,
                'alt_text' => $row->alt_text,
                'caption' => $row->caption,
                'sort_order' => $row->sort_order,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' reservation_hero_images row(s) from prod.');
    }
}
