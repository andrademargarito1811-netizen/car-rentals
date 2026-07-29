<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            try {
                $pdo = DB::connection()->getPdo();
                $pdo->sqliteCreateFunction('DATEADD', function ($unit, $amount, $date) {
                    $modifiers = [
                        'MINUTE' => "+{$amount} minutes",
                        'HOUR' => "+{$amount} hours",
                        'DAY' => "+{$amount} days",
                        'MONTH' => "+{$amount} months",
                        'YEAR' => "+{$amount} years",
                    ];
                    $modifier = $modifiers[strtoupper($unit)] ?? "+{$amount} {$unit}";
                    return date('Y-m-d H:i:s', strtotime($modifier, strtotime($date)));
                }, 3);
            } catch (\Exception $e) {
                // PDO not available, skip registration
            }
        }
    }
}
