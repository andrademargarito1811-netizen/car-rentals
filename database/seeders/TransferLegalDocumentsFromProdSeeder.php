<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferLegalDocumentsFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('legal_documents')) {
            $this->command?->warn('prod legal_documents table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('legal_documents')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No legal_documents rows to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('legal_documents')->upsert([
                'id' => $row->id,
                'slug' => $row->slug,
                'title' => $row->title,
                'subtitle' => $row->subtitle,
                'content' => $row->content,
                'type' => $row->type,
                'version' => $row->version,
                'updated_by' => $row->updated_by,
                'is_active' => $row->is_active,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ], ['id']);
        }

        $this->command?->info('Upserted '.count($rows).' legal_documents row(s) from prod.');
    }
}
