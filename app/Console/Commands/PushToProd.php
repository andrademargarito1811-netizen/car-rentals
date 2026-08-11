<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PushToProd extends Command
{
    protected $signature = 'db:push-to-prod';

    protected $description = 'Copy all data from local to prod database';

    public function handle()
    {
        $local = DB::connection();
        $prod = DB::connection('prod');

        $tables = $local->select(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
            [$local->getDatabaseName()]
        );
        $tables = array_map(fn ($t) => $t->TABLE_NAME, $tables);

        $exclude = ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs'];

        $prod->statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($tables as $table) {
            if (in_array($table, $exclude)) {
                $this->info("Skipped: $table (system)");

                continue;
            }

            $count = $local->table($table)->count();
            if ($count === 0) {
                $this->info("Skipped: $table (empty)");

                continue;
            }

            $prod->statement("TRUNCATE TABLE `$table`");

            $this->info("Copying: $table ($count rows)");
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            $pdo = $prod->getPdo();

            $local->table($table)->orderBy(DB::raw('(SELECT NULL)'))->chunk(100, function ($rows) use ($pdo, $table, $bar) {
                $records = $rows->map(fn ($r) => (array) $r)->toArray();
                $columns = implode(', ', array_map(fn ($c) => "`$c`", array_keys($records[0])));
                $placeholders = implode(', ', array_fill(0, count($records[0]), '?'));

                $stmt = $pdo->prepare("INSERT INTO `$table` ($columns) VALUES ($placeholders)");
                foreach ($records as $record) {
                    $stmt->execute(array_values($record));
                }

                $bar->advance($rows->count());
            });

            $bar->finish();
            $this->newLine();
            $this->info("Done: $table");
        }

        $prod->statement('SET FOREIGN_KEY_CHECKS=1');

        $this->newLine();
        $this->info('All data copied to prod successfully!');
    }
}
