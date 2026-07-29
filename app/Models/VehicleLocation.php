<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleLocation extends Model
{
    use HasFactory;
    protected $table = 'tblvehicle_location';
    protected $primaryKey = 'location_id';
    public $timestamps = true;

    protected $fillable = [
        'location', 'address', 'subtitle', 'city', 'phone', 'hours',
        'lat', 'lng', 'image', 'description', 'features',
        'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'lat' => 'decimal:7',
            'lng' => 'decimal:7',
            'sort_order' => 'integer',
        ];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    protected static function booted(): void
    {
        static::saved(fn () => cache()->forget('shared.locations'));
        static::deleted(fn () => cache()->forget('shared.locations'));
    }
}
