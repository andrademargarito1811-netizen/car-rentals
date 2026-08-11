<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TransferUsersFromProdSeeder extends Seeder
{
    public function run(): void
    {
        $prod = DB::connection('prod');

        if (! $prod->getSchemaBuilder()->hasTable('users')) {
            $this->command?->warn('prod users table not found; skipping transfer.');

            return;
        }

        $rows = $prod->table('users')->orderBy('id')->get();

        if ($rows->isEmpty()) {
            $this->command?->warn('No users to transfer from prod.');

            return;
        }

        foreach ($rows as $row) {
            DB::table('users')->insertOrIgnore([
                'id' => $row->id,
                'name' => $row->name,
                'username' => $row->username,
                'email' => $row->email,
                'profile_photo_path' => $row->profile_photo_path,
                'email_verified_at' => $row->email_verified_at,
                'password' => $row->password,
                'remember_token' => $row->remember_token,
                'phone' => $row->phone,
                'date_of_birth' => $row->date_of_birth,
                'gender' => $row->gender,
                'address' => $row->address,
                'emergency_contact_name' => $row->emergency_contact_name,
                'emergency_contact_phone' => $row->emergency_contact_phone,
                'driver_license_number' => $row->driver_license_number,
                'driver_license_expiry' => $row->driver_license_expiry,
                'preferred_language' => $row->preferred_language,
                'timezone' => $row->timezone,
                'notes' => $row->notes,
                'role' => $row->role,
                'two_factor_secret' => $row->two_factor_secret,
                'two_factor_recovery_codes' => $row->two_factor_recovery_codes,
                'two_factor_confirmed_at' => $row->two_factor_confirmed_at,
                'status' => $row->status,
                'last_active_at' => $row->last_active_at,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        $this->command?->info('Transferred '.count($rows).' users from prod.');
    }
}
