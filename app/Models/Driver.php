<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Driver extends Model
{
    use HasFactory;

    protected $table = 'drivers';
    protected $primaryKey = 'driver_id';

    protected $fillable = [
        'guest_id', 'first_name', 'last_name', 'birth_date',
        'license_number', 'license_number_hash', 'license_category', 'license_expiry',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'license_expiry' => 'date:Y-m-d',
            'license_number' => 'encrypted',
        ];
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class, 'guest_id', 'guest_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'driver_id', 'driver_id');
    }

    public function age(): ?int
    {
        if (!$this->birth_date) {
            return null;
        }

        return $this->birth_date->age;
    }

    public function maskedLicenseNumber(): string
    {
        if (empty($this->license_number)) {
            return '';
        }

        $digits = preg_replace('/[^A-Za-z0-9]/', '', (string) $this->license_number);
        if (strlen($digits) <= 4) {
            return $digits;
        }

        return str_repeat('•', strlen($digits) - 4) . substr($digits, -4);
    }
}
