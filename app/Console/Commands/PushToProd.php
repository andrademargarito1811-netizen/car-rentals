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
        $local = DB::connection('sqlsrv');
        $prod = DB::connection('prod_sqlsrv');

        $tables = $local->select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
        $tables = array_map(fn($t) => $t->TABLE_NAME, $tables);

        $exclude = ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs'];

        $this->disableConstraints($prod);

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

            $prod->statement("DELETE FROM [$table]");

            $this->info("Copying: $table ($count rows)");
            $bar = $this->output->createProgressBar($count);
            $bar->start();

            $pdo = $prod->getPdo();
            $hasIdentity = (bool) $prod->selectOne("SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.' + ?) AND is_identity = 1", [$table]);

            if ($hasIdentity) {
                $pdo->exec("SET IDENTITY_INSERT [$table] ON");
            }

            $local->table($table)->orderBy(DB::raw('(SELECT NULL)'))->chunk(100, function ($rows) use ($prod, $pdo, $table, $bar) {
                $records = $rows->map(fn($r) => (array) $r)->toArray();
                $columns = implode(', ', array_map(fn($c) => "[$c]", array_keys($records[0])));
                $placeholders = implode(', ', array_fill(0, count($records[0]), '?'));

                $stmt = $pdo->prepare("INSERT INTO [$table] ($columns) VALUES ($placeholders)");
                foreach ($records as $record) {
                    $stmt->execute(array_values($record));
                }

                $bar->advance($rows->count());
            });

            if ($hasIdentity) {
                $pdo->exec("SET IDENTITY_INSERT [$table] OFF");
            }
            $bar->finish();
            $this->newLine();
            $this->info("Done: $table");
        }

        $this->enableConstraints($prod);

        $this->newLine();
        $this->info('All data copied to prod successfully!');
    }

    protected function disableConstraints($prod)
    {
        $tables = $prod->select("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME NOT IN ('migrations')");
        foreach ($tables as $t) {
            $prod->statement("ALTER TABLE [{$t->TABLE_NAME}] NOCHECK CONSTRAINT ALL");
        }
        $prod->statement('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL"');
        $this->info('Constraints disabled on prod');
    }

    protected function enableConstraints($prod)
    {
        $prod->statement('EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL"');
        $this->info('Constraints re-enabled on prod');
    }
}
